// =============================================
// AnuLunar API - Report Download Endpoints
// Using Supabase Storage
// =============================================

import { createClient } from '@supabase/supabase-js';
import { supabaseStorage } from './supabase_storage_service.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =============================================
// Report Download API Endpoints
// =============================================

// GET /v1/reports/download/:reportId
export async function downloadReport(req, res) {
  try {
    const { reportId } = req.params;
    const userId = req.user?.id; // From auth middleware

    if (!reportId) {
      return res.status(400).json({
        error: 'Report ID is required'
      });
    }

    // Get report record with access validation
    const { data: report, error } = await supabase
      .from('spiritual_reports')
      .select(`
        *,
        profiles!inner(id, email, first_name, last_name)
      `)
      .eq('id', reportId)
      .eq('profiles.id', userId) // Ensure user owns this report
      .eq('generation_status', 'completed')
      .single();

    if (error || !report) {
      return res.status(404).json({
        error: 'Report not found or access denied'
      });
    }

    // Extract filename from report_pdf_url if available
    let filename = null;
    if (report.report_pdf_url) {
      // Extract filename from Supabase signed URL
      const urlParts = report.report_pdf_url.split('/');
      filename = urlParts[urlParts.length - 1].split('?')[0];
    }

    // If no stored URL, try to find the file
    if (!filename) {
      const reportFiles = await supabaseStorage.listProfileReports(report.profile_id);
      const matchingFile = reportFiles.find(file => 
        file.name.includes(report.report_type)
      );
      
      if (matchingFile) {
        filename = `${supabaseStorage.reportPath}/${report.profile_id}/${matchingFile.name}`;
      }
    }

    if (!filename) {
      return res.status(404).json({
        error: 'Report file not found'
      });
    }

    // Generate fresh signed URL (24 hour expiry)
    const signedUrl = await supabaseStorage.getReportUrl(filename, 86400);

    if (!signedUrl) {
      return res.status(500).json({
        error: 'Failed to generate download link'
      });
    }

    // Log download activity
    await logDownloadActivity(reportId, userId, req);

    // Return download information
    res.json({
      success: true,
      report: {
        id: report.id,
        type: report.report_type,
        tier: report.report_tier,
        generated_at: report.generated_at,
        download_url: signedUrl,
        expires_at: new Date(Date.now() + 86400 * 1000).toISOString() // 24 hours
      }
    });

  } catch (error) {
    console.error('❌ Error in downloadReport:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// GET /v1/reports/list
export async function listUserReports(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get all reports for the user
    const { data: reports, error } = await supabase
      .from('spiritual_reports')
      .select('id, report_type, report_tier, sacred_price, generation_status, generated_at, created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user reports:', error);
      return res.status(500).json({
        error: 'Failed to fetch reports'
      });
    }

    res.json({
      success: true,
      reports: reports || []
    });

  } catch (error) {
    console.error('❌ Error in listUserReports:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// GET /v1/reports/status/:profileId
export async function getReportStatus(req, res) {
  try {
    const { profileId } = req.params;
    const userId = req.user?.id;

    // Verify user owns this profile
    if (profileId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Get completion status using our database function
    const { data: status, error } = await supabase
      .rpc('get_profile_completion_status', { 
        p_profile_id: profileId 
      });

    if (error) {
      console.error('❌ Error checking completion status:', error);
      return res.status(500).json({
        error: 'Failed to check status'
      });
    }

    // Get available reports
    const { data: reports } = await supabase
      .from('spiritual_reports')
      .select('id, report_type, generation_status, generated_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      profile_id: profileId,
      completion_status: status,
      available_reports: reports || []
    });

  } catch (error) {
    console.error('❌ Error in getReportStatus:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// POST /v1/reports/generate/:reportType
export async function generateReport(req, res) {
  try {
    const { reportType } = req.params;
    const { tier = 'crystal_clarity' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const validReportTypes = ['inner_child_healing', 'karmic_blueprint', 'complete_spiritual_intelligence'];
    const validTiers = ['crystal_clarity', 'full_spectrum_circle'];

    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        error: 'Invalid report type'
      });
    }

    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid report tier'
      });
    }

    // Check if user has all required data
    const { data: status } = await supabase
      .rpc('get_profile_completion_status', { 
        p_profile_id: userId 
      });

    if (!status?.complete) {
      return res.status(400).json({
        error: 'Complete profile data required before generating reports',
        missing_data: {
          numerology_ready: status?.numerology_ready || false,
          astrology_ready: status?.astrology_ready || false,
          celtic_ready: status?.celtic_ready || false
        }
      });
    }

    // Set sacred pricing
    const sacredPrices = {
      crystal_clarity: 44.44,
      full_spectrum_circle: 99.99
    };

    // Create report generation request
    const { data: report, error } = await supabase
      .from('spiritual_reports')
      .insert([{
        profile_id: userId,
        report_type: reportType,
        report_tier: tier,
        sacred_price: sacredPrices[tier],
        generation_status: 'generating',
        synthesized_content: {}
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating report request:', error);
      return res.status(500).json({
        error: 'Failed to queue report generation'
      });
    }

    // Trigger background report generation
    setImmediate(async () => {
      try {
        await generateReportBackground(report.id, userId, reportType);
      } catch (error) {
        console.error('❌ Background report generation failed:', error);
      }
    });

    res.json({
      success: true,
      report_id: report.id,
      generation_status: 'generating',
      estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      sacred_price: sacredPrices[tier]
    });

  } catch (error) {
    console.error('❌ Error in generateReport:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// =============================================
// Helper Functions
// =============================================

async function logDownloadActivity(reportId, userId, req) {
  try {
    // Log download for analytics
    await supabase
      .from('report_downloads')
      .insert([{
        report_id: reportId,
        profile_id: userId,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        downloaded_at: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('❌ Error logging download activity:', error);
  }
}

async function generateReportBackground(reportId, profileId, reportType) {
  try {
    // Get all data needed for report generation
    const { data: reportData, error } = await supabase
      .from('profiles')
      .select(`
        *,
        numerology_reports(*),
        astrology_reports(*),
        celtic_moon_reports(*)
      `)
      .eq('id', profileId)
      .single();

    if (error || !reportData) {
      throw new Error('Failed to fetch complete report data');
    }

    // Get the report record
    const { data: report } = await supabase
      .from('spiritual_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (!report) {
      throw new Error('Report record not found');
    }

    // Generate and store the report using Supabase Storage
    const result = await supabaseStorage.generateAndStoreReport(reportId, {
      ...report,
      profile: reportData,
      numerology: reportData.numerology_reports[0],
      astrology: reportData.astrology_reports[0],
      celticMoon: reportData.celtic_moon_reports[0]
    });

    if (result) {
      console.log('✅ Background report generation completed');
      
      // Send completion notification
      await sendReportReadyNotification(reportData.email, {
        first_name: reportData.first_name,
        report_type: reportType,
        download_url: result.downloadUrl
      });
    }

  } catch (error) {
    console.error('❌ Background report generation failed:', error);
    
    // Update report status to failed
    await supabase
      .from('spiritual_reports')
      .update({
        generation_status: 'failed',
        generated_at: new Date().toISOString()
      })
      .eq('id', reportId);
  }
}

async function sendReportReadyNotification(email, data) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        to: [{ email: email, name: data.first_name }],
        templateId: parseInt(process.env.BREVO_FULL_REPORT_READY_TEMPLATE_ID),
        params: data
      })
    });

    if (response.ok) {
      console.log(`📧 Report ready notification sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Error sending report ready notification:', error);
  }
}