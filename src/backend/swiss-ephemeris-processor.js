// =============================================
// AnuLunar Swiss Ephemeris Background Processor
// Polls astrology_inputs and processes calculations
// =============================================

import { createClient } from '@supabase/supabase-js';
import { createSwissEphemerisInput } from './anulunar_backend_integration.js';

// Initialize Supabase client with service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Swiss Ephemeris service endpoint
const SWISS_EPHEMERIS_SERVICE_URL = process.env.SWISS_EPHEMERIS_URL || 'http://localhost:3001/calculate';

// =============================================
// Background Polling Service
// =============================================
export class SwissEphemerisProcessor {
  constructor() {
    this.isProcessing = false;
    this.pollInterval = 30000; // 30 seconds
    this.maxConcurrent = 3; // Process max 3 charts at once
  }

  // Start the background polling service
  start() {
    console.log('🌟 AnuLunar Swiss Ephemeris Processor starting...');
    this.poll();
    
    // Set up recurring poll
    setInterval(() => {
      if (!this.isProcessing) {
        this.poll();
      }
    }, this.pollInterval);
  }

  // Poll for pending astrology calculations
  async poll() {
    try {
      this.isProcessing = true;

      // Get pending astrology inputs
      const { data: pendingInputs, error } = await supabase
        .from('astrology_inputs')
        .select(`
          id,
          profile_id,
          utc_datetime,
          latitude,
          longitude,
          profiles!inner(
            first_name,
            last_name,
            email,
            birth_timezone
          )
        `)
        .eq('ephemeris_ready', true)
        .is('processing_started_at', null)
        .order('created_at', { ascending: true })
        .limit(this.maxConcurrent);

      if (error) {
        console.error('❌ Error fetching pending astrology inputs:', error);
        return;
      }

      if (!pendingInputs || pendingInputs.length === 0) {
        // No pending calculations
        return;
      }

      console.log(`🔮 Processing ${pendingInputs.length} astrology calculations...`);

      // Process each input
      const processingPromises = pendingInputs.map(input => 
        this.processAstrologyInput(input)
      );

      await Promise.allSettled(processingPromises);

    } catch (error) {
      console.error('❌ Error in Swiss Ephemeris polling:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a single astrology input
  async processAstrologyInput(input) {
    try {
      console.log(`🌙 Processing astrology for profile ${input.profile_id}...`);

      // Lock the row by marking processing started
      const { error: lockError } = await supabase
        .from('astrology_inputs')
        .update({ processing_started_at: new Date().toISOString() })
        .eq('id', input.id);

      if (lockError) {
        console.error('❌ Error locking astrology input:', lockError);
        return;
      }

      // Create Swiss Ephemeris input object per backend contract
      const swissInput = {
        profile_id: input.profile_id,
        utc_datetime: input.utc_datetime,
        latitude: input.latitude,
        longitude: input.longitude,
        house_system: "Placidus",
        zodiac_system: "Tropical",
        requested_planets: [
          "Sun",
          "Moon",
          "Mercury", 
          "Venus",
          "Mars",
          "Jupiter",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto"
        ]
      };

      // Call Swiss Ephemeris service
      const astrologyData = await this.callSwissEphemeris(swissInput);

      if (astrologyData) {
        // Store astrology report
        await this.storeAstrologyReport(input.profile_id, astrologyData);
        
        // Trigger notifications
        await this.triggerNotifications(input.profile_id, input.profiles);
        
        console.log(`✅ Completed astrology for ${input.profiles.first_name} ${input.profiles.last_name}`);
      } else {
        console.error(`❌ Swiss Ephemeris calculation failed for profile ${input.profile_id}`);
      }

    } catch (error) {
      console.error('❌ Error processing astrology input:', error);
    }
  }

  // Call Swiss Ephemeris calculation service
  async callSwissEphemeris(swissInput) {
    try {
      const response = await fetch(SWISS_EPHEMERIS_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SWISS_EPHEMERIS_API_KEY}`
        },
        body: JSON.stringify(swissInput)
      });

      if (!response.ok) {
        throw new Error(`Swiss Ephemeris service error: ${response.status}`);
      }

      const astrologyData = await response.json();
      return astrologyData;

    } catch (error) {
      console.error('❌ Swiss Ephemeris service call failed:', error);
      return null;
    }
  }

  // Store astrology report in database
  async storeAstrologyReport(profileId, astrologyData) {
    try {
      const reportData = {
        profile_id: profileId,
        sun_sign: astrologyData.planets?.Sun?.sign || null,
        moon_sign: astrologyData.planets?.Moon?.sign || null,
        rising_sign: astrologyData.houses?.ascendant?.sign || null,
        mercury_sign: astrologyData.planets?.Mercury?.sign || null,
        venus_sign: astrologyData.planets?.Venus?.sign || null,
        mars_sign: astrologyData.planets?.Mars?.sign || null,
        full_chart_json: astrologyData,
        house_system: 'Placidus',
        zodiac_system: 'Tropical'
      };

      const { error } = await supabase
        .from('astrology_reports')
        .insert([reportData]);

      if (error) {
        console.error('❌ Error storing astrology report:', error);
        throw error;
      }

      console.log(`💫 Astrology report stored for profile ${profileId}`);

    } catch (error) {
      console.error('❌ Error in storeAstrologyReport:', error);
      throw error;
    }
  }

  // Trigger email notifications and UI updates
  async triggerNotifications(profileId, profile) {
    try {
      // Trigger Brevo email automation
      await this.triggerBrevoEmail(profile.email, {
        first_name: profile.first_name,
        profile_id: profileId
      });

      // Update UI notification system (could be real-time via Supabase channels)
      await this.updateUINotification(profileId);

      // Check if all reports are complete for full spiritual intelligence report
      const completionStatus = await this.checkReportCompletion(profileId);
      
      if (completionStatus.complete) {
        await this.triggerFullReportGeneration(profileId);
      }

    } catch (error) {
      console.error('❌ Error triggering notifications:', error);
    }
  }

  // Trigger Brevo email automation
  async triggerBrevoEmail(email, templateData) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          to: [{ email: email, name: templateData.first_name }],
          templateId: parseInt(process.env.BREVO_ASTROLOGY_COMPLETE_TEMPLATE_ID),
          params: templateData
        })
      });

      if (response.ok) {
        console.log(`📧 Astrology completion email sent to ${email}`);
      }

    } catch (error) {
      console.error('❌ Error sending Brevo email:', error);
    }
  }

  // Update UI notification
  async updateUINotification(profileId) {
    // This could trigger real-time updates via Supabase realtime
    const channel = supabase.channel('astrology-updates');
    channel.send({
      type: 'broadcast',
      event: 'astrology-complete',
      payload: { profile_id: profileId }
    });
  }

  // Check if all reports are complete
  async checkReportCompletion(profileId) {
    try {
      const { data, error } = await supabase
        .rpc('get_profile_completion_status', { 
          p_profile_id: profileId 
        });

      if (error) {
        console.error('❌ Error checking completion status:', error);
        return { complete: false };
      }

      return data;

    } catch (error) {
      console.error('❌ Error in checkReportCompletion:', error);
      return { complete: false };
    }
  }

  // Trigger full spiritual intelligence report generation
  async triggerFullReportGeneration(profileId) {
    try {
      // Queue full report generation
      const { error } = await supabase
        .from('spiritual_reports')
        .insert([{
          profile_id: profileId,
          report_type: 'complete_spiritual_intelligence',
          report_tier: 'full_spectrum_circle',
          sacred_price: 99.99,
          generation_status: 'pending',
          synthesized_content: {}
        }]);

      if (!error) {
        console.log(`🌟 Full spiritual intelligence report queued for profile ${profileId}`);
        
        // Import Supabase Storage service
        const { supabaseStorage } = await import('./supabase_storage_service.js');
        
        // Generate and store the report
        await this.generateCompleteReport(profileId);
      }

    } catch (error) {
      console.error('❌ Error triggering full report generation:', error);
    }
  }

  // Generate complete spiritual intelligence report
  async generateCompleteReport(profileId) {
    try {
      // Get all report data for the profile
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
        console.error('❌ Error fetching complete report data:', error);
        return;
      }

      // Import Supabase Storage service
      const { supabaseStorage } = await import('./supabase_storage_service.js');

      // Get the pending spiritual report record
      const { data: spiritualReport } = await supabase
        .from('spiritual_reports')
        .select('*')
        .eq('profile_id', profileId)
        .eq('generation_status', 'pending')
        .single();

      if (spiritualReport) {
        // Generate and store the complete report
        const result = await supabaseStorage.generateAndStoreReport(
          spiritualReport.id,
          {
            ...spiritualReport,
            profile: reportData,
            numerology: reportData.numerology_reports[0],
            astrology: reportData.astrology_reports[0],
            celticMoon: reportData.celtic_moon_reports[0]
          }
        );

        if (result) {
          console.log('✅ Complete spiritual intelligence report generated and stored in Supabase');
          
          // Send completion email
          await this.sendReportCompletionEmail(reportData.email, {
            first_name: reportData.first_name,
            download_url: result.downloadUrl,
            report_type: spiritualReport.report_type
          });
        }
      }

    } catch (error) {
      console.error('❌ Error generating complete report:', error);
    }
  }

  // Send report completion email
  async sendReportCompletionEmail(email, data) {
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
        console.log(`📧 Full report completion email sent to ${email}`);
      }

    } catch (error) {
      console.error('❌ Error sending report completion email:', error);
    }
  }
}

// =============================================
// Service Startup
// =============================================
export function startSwissEphemerisProcessor() {
  const processor = new SwissEphemerisProcessor();
  processor.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🌙 Swiss Ephemeris Processor shutting down gracefully...');
    process.exit(0);
  });
  
  return processor;
}

// Start the processor if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startSwissEphemerisProcessor();
}