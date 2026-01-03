// =============================================
// AnuLunar Supabase Storage Integration
// PDF Report Storage and Management
// =============================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =============================================
// Supabase Storage Service
// =============================================
export class SupabaseStorageService {
  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'anulunar-reports';
    this.reportPath = process.env.REPORT_STORAGE_PATH || 'spiritual-reports';
  }

  // Initialize storage bucket if it doesn't exist
  async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create the bucket
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: 10485760 // 10MB limit for PDF reports
        });

        if (error) {
          console.error('❌ Error creating storage bucket:', error);
          return false;
        }

        console.log('✅ Created Supabase storage bucket:', this.bucketName);
      }

      return true;

    } catch (error) {
      console.error('❌ Error initializing storage bucket:', error);
      return false;
    }
  }

  // Store PDF report in Supabase Storage
  async storeReport(profileId, reportType, pdfBuffer, metadata = {}) {
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.reportPath}/${profileId}/${reportType}_${timestamp}.pdf`;

      // Upload PDF to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          metadata: {
            profileId,
            reportType,
            generatedAt: new Date().toISOString(),
            ...metadata
          }
        });

      if (error) {
        console.error('❌ Error uploading PDF to Supabase Storage:', error);
        return null;
      }

      // Get public URL (signed for private access)
      const { data: urlData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filename, 31536000); // 1 year expiry

      console.log('✅ PDF report stored successfully:', filename);

      return {
        filename,
        path: data.path,
        fullPath: data.fullPath,
        signedUrl: urlData?.signedUrl,
        size: pdfBuffer.length,
        uploadedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error storing PDF report:', error);
      return null;
    }
  }

  // Get signed URL for report access
  async getReportUrl(filename, expirySeconds = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filename, expirySeconds);

      if (error) {
        console.error('❌ Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;

    } catch (error) {
      console.error('❌ Error getting report URL:', error);
      return null;
    }
  }

  // List all reports for a profile
  async listProfileReports(profileId) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(`${this.reportPath}/${profileId}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ Error listing profile reports:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Error listing reports:', error);
      return [];
    }
  }

  // Delete a report
  async deleteReport(filename) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .remove([filename]);

      if (error) {
        console.error('❌ Error deleting report:', error);
        return false;
      }

      console.log('✅ Report deleted successfully:', filename);
      return true;

    } catch (error) {
      console.error('❌ Error deleting report:', error);
      return false;
    }
  }

  // Update spiritual_reports table with storage info
  async updateReportRecord(reportId, storageInfo) {
    try {
      const { data, error } = await supabase
        .from('spiritual_reports')
        .update({
          report_pdf_url: storageInfo.signedUrl,
          generation_status: 'completed',
          generated_at: new Date().toISOString(),
          delivered_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select();

      if (error) {
        console.error('❌ Error updating report record:', error);
        return null;
      }

      return data[0];

    } catch (error) {
      console.error('❌ Error updating report record:', error);
      return null;
    }
  }

  // Generate and store complete spiritual intelligence report
  async generateAndStoreReport(reportId, reportData) {
    try {
      console.log('📄 Generating PDF report for ID:', reportId);

      // Generate PDF using your preferred PDF library (e.g., Puppeteer, jsPDF, etc.)
      const pdfBuffer = await this.generatePDFReport(reportData);

      if (!pdfBuffer) {
        throw new Error('PDF generation failed');
      }

      // Store in Supabase Storage
      const storageInfo = await this.storeReport(
        reportData.profile_id,
        reportData.report_type,
        pdfBuffer,
        {
          reportId,
          tier: reportData.report_tier,
          sacredPrice: reportData.sacred_price
        }
      );

      if (!storageInfo) {
        throw new Error('PDF storage failed');
      }

      // Update database record
      const updatedReport = await this.updateReportRecord(reportId, storageInfo);

      console.log('✅ Complete spiritual intelligence report generated and stored');

      return {
        reportId,
        downloadUrl: storageInfo.signedUrl,
        filename: storageInfo.filename,
        size: storageInfo.size,
        generatedAt: storageInfo.uploadedAt
      };

    } catch (error) {
      console.error('❌ Error generating and storing report:', error);
      
      // Update report status to failed
      await supabase
        .from('spiritual_reports')
        .update({
          generation_status: 'failed',
          generated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      return null;
    }
  }

  // Generate PDF report using template (placeholder - implement with your preferred PDF library)
  async generatePDFReport(reportData) {
    try {
      // This would integrate with your PDF generation service
      // For example, using Puppeteer, jsPDF, or a dedicated service
      
      console.log('🔄 Generating PDF for report type:', reportData.report_type);
      
      // Placeholder - replace with actual PDF generation
      const pdfContent = await this.renderReportTemplate(reportData);
      
      // Convert to buffer (implementation depends on your PDF library)
      const pdfBuffer = Buffer.from(pdfContent);
      
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      return null;
    }
  }

  // Render report template (placeholder for your templating system)
  async renderReportTemplate(reportData) {
    // This would integrate with your LUNARIS™ synthesis system
    // and render the beautiful cosmic PDF reports
    
    const templateData = {
      profileInfo: reportData.profile,
      numerologyData: reportData.numerology,
      astrologyData: reportData.astrology,
      celticMoonData: reportData.celticMoon,
      lunarisInsights: reportData.lunarisSynthesis,
      reportType: reportData.report_type,
      generatedAt: new Date().toISOString()
    };

    // Render template (implement with your preferred method)
    return this.compileTemplate(templateData);
  }

  // Template compiler (placeholder)
  async compileTemplate(data) {
    // Placeholder for actual template compilation
    // Could use Handlebars, React PDF, or custom solution
    return "PDF content would be generated here";
  }

  // Cleanup old reports (optional maintenance function)
  async cleanupOldReports(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // List all files older than cutoff
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(this.reportPath, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error || !files) {
        console.error('❌ Error listing files for cleanup:', error);
        return;
      }

      const oldFiles = files.filter(file => 
        new Date(file.created_at) < cutoffDate
      );

      if (oldFiles.length > 0) {
        const filePaths = oldFiles.map(file => `${this.reportPath}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from(this.bucketName)
          .remove(filePaths);

        if (deleteError) {
          console.error('❌ Error deleting old files:', deleteError);
        } else {
          console.log(`🧹 Cleaned up ${oldFiles.length} old report files`);
        }
      }

    } catch (error) {
      console.error('❌ Error in cleanup process:', error);
    }
  }
}

// =============================================
// Export singleton instance
// =============================================
export const supabaseStorage = new SupabaseStorageService();

// Initialize bucket on module load
supabaseStorage.initializeBucket().catch(console.error);