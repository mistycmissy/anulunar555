// =============================================
// AnuLunar™ - Brevo CRM Integration Service
// Connects spiritual intelligence data to Brevo
// =============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class BrevoIntegrationService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseUrl = 'https://api.brevo.com/v3';
    this.listId = parseInt(process.env.BREVO_MASTER_LIST_ID || '2'); // AnuLunar Spiritual Intelligence List
  }

  // =============================================
  // CORE CRM OPERATIONS
  // =============================================

  async createContact(profileData) {
    try {
      const contact = {
        email: profileData.email,
        attributes: {
          FIRSTNAME: profileData.first_name,
          LASTNAME: profileData.last_name,
          SMS: profileData.phone || '',
          
          // Birth Data
          BIRTH_DATE: profileData.birth_date,
          BIRTH_CITY: profileData.birth_city,
          BIRTH_COUNTRY: profileData.birth_country,
          BIRTH_TIME: `${profileData.birth_hour}:${profileData.birth_minute}`,
          TIMEZONE: profileData.birth_timezone,
          
          // Numerology Core Numbers
          LIFE_PATH: profileData.life_path_number,
          EXPRESSION: profileData.expression_number,
          SOUL_URGE: profileData.soul_urge_number,
          
          // Celtic Moon Data
          CELTIC_TREE: profileData.celtic_tree_sign,
          LUNAR_PHASE: profileData.lunar_phase,
          
          // Astrology Basics
          SUN_SIGN: profileData.sun_sign,
          MOON_SIGN: profileData.moon_sign,
          RISING_SIGN: profileData.rising_sign,
          
          // AnuLunar Specific
          PROFILE_ID: profileData.id,
          CREATED_AT: profileData.created_at,
          SUBSCRIPTION_TIER: profileData.subscription_tier || 'free',
          LUNARIS_SCORE: profileData.lunaris_compatibility_score,
          
          // Engagement Tracking
          REPORTS_GENERATED: 0,
          LAST_REPORT: null,
          EMAIL_ENGAGEMENT: 'new',
          COSMIC_PREFERENCES: JSON.stringify(profileData.preferences || {})
        },
        listIds: [this.listId],
        updateEnabled: true // Update if contact already exists
      };

      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(contact)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo contact creation failed: ${error.message}`);
      }

      const result = await response.json();
      console.log(`✅ Brevo contact created: ${profileData.email}`);
      
      // Log to Supabase for tracking
      await this.logBrevoSync(profileData.id, 'contact_created', result);
      
      return result;
    } catch (error) {
      console.error('❌ Brevo contact creation error:', error);
      await this.logBrevoSync(profileData.id, 'contact_failed', { error: error.message });
      throw error;
    }
  }

  async updateContactReportGenerated(email, reportData) {
    try {
      const attributes = {
        REPORTS_GENERATED: reportData.totalReports || 1,
        LAST_REPORT: new Date().toISOString(),
        LAST_REPORT_TYPE: reportData.reportType,
        LAST_REPORT_TIER: reportData.reportTier
      };

      const response = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({ attributes })
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.status}`);
      }

      console.log(`✅ Updated Brevo contact report data: ${email}`);
    } catch (error) {
      console.error('❌ Brevo contact update error:', error);
    }
  }

  // =============================================
  // EMAIL AUTOMATION
  // =============================================

  async sendWelcomeSequence(profileData) {
    try {
      // Send immediate welcome with mini blueprint
      await this.sendTransactionalEmail({
        templateId: parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID),
        to: [{ email: profileData.email, name: profileData.first_name }],
        params: {
          firstName: profileData.first_name,
          lifePath: profileData.life_path_number,
          expression: profileData.expression_number,
          soulUrge: profileData.soul_urge_number,
          celticTree: profileData.celtic_tree_sign,
          profileUrl: `${process.env.FRONTEND_URL}/profile/${profileData.id}`
        }
      });

      console.log(`📧 Welcome sequence initiated for: ${profileData.email}`);
    } catch (error) {
      console.error('❌ Welcome sequence error:', error);
    }
  }

  async sendReportReadyNotification(email, reportData) {
    try {
      await this.sendTransactionalEmail({
        templateId: parseInt(process.env.BREVO_REPORT_READY_TEMPLATE_ID),
        to: [{ email: email, name: reportData.firstName }],
        params: {
          firstName: reportData.firstName,
          reportType: reportData.reportType,
          reportTier: reportData.reportTier,
          downloadUrl: reportData.downloadUrl,
          generatedAt: new Date().toLocaleDateString(),
          expiresAt: reportData.expiresAt
        }
      });

      console.log(`📧 Report ready notification sent: ${email}`);
    } catch (error) {
      console.error('❌ Report notification error:', error);
    }
  }

  async sendLunarUpdate(email, lunarData) {
    try {
      await this.sendTransactionalEmail({
        templateId: parseInt(process.env.BREVO_LUNAR_UPDATE_TEMPLATE_ID),
        to: [{ email: email, name: lunarData.firstName }],
        params: {
          firstName: lunarData.firstName,
          currentPhase: lunarData.currentPhase,
          phaseEnergy: lunarData.phaseEnergy,
          guidance: lunarData.guidance,
          nextSignificantDate: lunarData.nextSignificantDate
        }
      });

      console.log(`🌙 Lunar update sent: ${email}`);
    } catch (error) {
      console.error('❌ Lunar update error:', error);
    }
  }

  async sendTransactionalEmail(emailData) {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo email failed: ${error.message}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Brevo transactional email error:', error);
      throw error;
    }
  }

  // =============================================
  // ENGAGEMENT TRACKING
  // =============================================

  async trackEmailEngagement() {
    try {
      // Get email events from Brevo
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        headers: {
          'Accept': 'application/json',
          'api-key': this.apiKey
        }
      });

      if (response.ok) {
        const events = await response.json();
        
        for (const event of events.webhooks || []) {
          await this.processEmailEvent(event);
        }
      }
    } catch (error) {
      console.error('❌ Email engagement tracking error:', error);
    }
  }

  async processEmailEvent(event) {
    try {
      const eventData = {
        email: event.email,
        event_type: event.event,
        message_id: event.messageId,
        template_id: event.templateId,
        occurred_at: event.date,
        campaign_name: event.subject
      };

      // Store in Supabase for analytics
      await supabase
        .from('email_events')
        .insert([eventData]);

      // Update contact engagement score
      if (['opened', 'clicked'].includes(event.event)) {
        await this.updateContactEngagement(event.email, event.event);
      }
    } catch (error) {
      console.error('❌ Email event processing error:', error);
    }
  }

  async updateContactEngagement(email, eventType) {
    try {
      let engagementScore = 'low';
      
      if (eventType === 'opened') engagementScore = 'medium';
      if (eventType === 'clicked') engagementScore = 'high';

      await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          attributes: {
            EMAIL_ENGAGEMENT: engagementScore,
            LAST_ENGAGEMENT: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('❌ Contact engagement update error:', error);
    }
  }

  // =============================================
  // SEGMENTATION & TARGETING
  // =============================================

  async createNumerologySegment(lifePathNumber) {
    try {
      const segmentData = {
        name: `Life Path ${lifePathNumber} - AnuLunar`,
        categoryName: 'Numerology',
        conditions: {
          LIFE_PATH: {
            type: 'string',
            operator: 'equals',
            value: lifePathNumber.toString()
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/contacts/segments`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(segmentData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created numerology segment: Life Path ${lifePathNumber}`);
        return result;
      }
    } catch (error) {
      console.error('❌ Segment creation error:', error);
    }
  }

  async createCelticMoonSegment(treeSign) {
    try {
      const segmentData = {
        name: `Celtic ${treeSign} - AnuLunar`,
        categoryName: 'Celtic Moon',
        conditions: {
          CELTIC_TREE: {
            type: 'string',
            operator: 'equals',
            value: treeSign
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/contacts/segments`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(segmentData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created Celtic Moon segment: ${treeSign}`);
        return result;
      }
    } catch (error) {
      console.error('❌ Celtic segment creation error:', error);
    }
  }

  // =============================================
  // SUPABASE SYNC LOGGING
  // =============================================

  async logBrevoSync(profileId, action, result) {
    try {
      await supabase
        .from('brevo_sync_log')
        .insert([{
          profile_id: profileId,
          action: action,
          result: result,
          synced_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('❌ Brevo sync logging error:', error);
    }
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  async syncExistingProfiles() {
    try {
      console.log('🔄 Starting batch sync of existing profiles...');
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          numerology_reports(*),
          celtic_moon_reports(*),
          astrology_reports(*)
        `)
        .is('brevo_synced', false)
        .limit(100);

      if (error) throw error;

      for (const profile of profiles || []) {
        try {
          await this.createContact(profile);
          
          // Mark as synced
          await supabase
            .from('profiles')
            .update({ brevo_synced: true })
            .eq('id', profile.id);
            
          // Delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to sync profile ${profile.id}:`, error);
        }
      }

      console.log(`✅ Batch sync completed: ${profiles.length} profiles processed`);
    } catch (error) {
      console.error('❌ Batch sync error:', error);
    }
  }
}

// =============================================
// EXPORT SERVICE INSTANCE
// =============================================

export const brevoService = new BrevoIntegrationService();

// =============================================
// WEBHOOK HANDLERS
// =============================================

export async function handleBrevoWebhook(req, res) {
  try {
    const event = req.body;
    
    // Verify webhook signature
    const signature = req.headers['x-brevo-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    await brevoService.processEmailEvent(event);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Brevo webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function verifyWebhookSignature(payload, signature) {
  // Implement webhook signature verification
  // Use your Brevo webhook secret
  return true; // Simplified for demo
}

export default brevoService;