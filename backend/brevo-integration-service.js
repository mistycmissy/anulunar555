// =============================================
// AnuLunar™ - Brevo CRM Integration Service
// Connects spiritual intelligence data to Brevo
// =============================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =============================================
// ENVIRONMENT VALIDATION
// =============================================

function validateEnvironment() {
  const requiredVars = [
    'BREVO_API_KEY',
    'BREVO_MASTER_LIST_ID',
    'BREVO_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class BrevoIntegrationService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseUrl = 'https://api.brevo.com/v3';
    this.listId = parseInt(process.env.BREVO_MASTER_LIST_ID);
    
    // Rate limiting properties
    this.requestQueue = [];
    this.lastRequestTime = 0;
    this.minRequestInterval = 200; // Minimum 200ms between requests
  }

  // =============================================
  // CORE CRM OPERATIONS
  // =============================================

  /**
   * Rate-limited fetch wrapper with retry logic
   * @param {string} url - The URL to fetch
   * @param {object} options - Fetch options
   * @param {number} retryCount - Current retry attempt (internal)
   * @returns {Promise<Response>} - Fetch response
   */
  async rateLimitedFetch(url, options, retryCount = 0) {
    // Enforce minimum time between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        
        if (retryCount < 3) {
          console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry ${retryCount + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.rateLimitedFetch(url, options, retryCount + 1);
        }
      }
      
      // Retry on server errors with exponential backoff
      if (!response.ok && response.status >= 500 && retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Server error ${response.status}. Retrying in ${waitTime}ms (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.rateLimitedFetch(url, options, retryCount + 1);
      }
      
      return response;
    } catch (error) {
      // Retry on network errors with exponential backoff
      if (retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Network error. Retrying in ${waitTime}ms (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.rateLimitedFetch(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Build contact attributes from profile data
   * @param {object} profileData - User profile data
   * @returns {object} - Contact attributes for Brevo
   */
  buildContactAttributes(profileData) {
    return {
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
    };
  }

  async createContact(profileData) {
    try {
      // Validate email is present upfront
      if (!profileData.email) {
        throw new Error('Email is required to create a contact');
      }

      const contact = {
        email: profileData.email,
        attributes: this.buildContactAttributes(profileData),
        listIds: [this.listId],
        updateEnabled: false // We'll handle duplicates manually
      };

      const response = await this.rateLimitedFetch(`${this.baseUrl}/contacts`, {
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
        
        // Handle duplicate contact by updating instead
        // Brevo returns code 'duplicate_parameter' when contact already exists
        if (error.code === 'duplicate_parameter') {
          console.log(`⚠️  Contact already exists, updating instead: ${profileData.email}`);
          return await this.updateContact(profileData.email, this.buildContactAttributes(profileData));
        }
        
        throw new Error(`Brevo contact creation failed (${response.status}): ${error.message || error.code}`);
      }

      const result = await response.json();
      console.log(`✅ Brevo contact created: ${profileData.email}`);
      
      // Log to Supabase for tracking
      await this.logBrevoSync(profileData.id, 'contact_created', result);
      
      return result;
    } catch (error) {
      console.error(`❌ Brevo contact creation error for ${profileData.email}:`, error.message);
      await this.logBrevoSync(profileData.id, 'contact_failed', { error: error.message });
      throw error; // Always re-throw so callers know the operation failed
    }
  }

  /**
   * Update an existing contact
   * @param {string} email - Contact email
   * @param {object} attributes - Attributes to update
   * @returns {Promise<object>} - Update result
   */
  async updateContact(email, attributes) {
    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({ attributes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to update contact (${response.status}): ${error.message || error.code}`);
      }

      console.log(`✅ Brevo contact updated: ${email}`);
      return { email, updated: true };
    } catch (error) {
      console.error(`❌ Brevo contact update error for ${email}:`, error.message);
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

      const response = await this.rateLimitedFetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
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
      const response = await this.rateLimitedFetch(`${this.baseUrl}/smtp/email`, {
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
      const response = await this.rateLimitedFetch(`${this.baseUrl}/webhooks`, {
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

      await this.rateLimitedFetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
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

      const response = await this.rateLimitedFetch(`${this.baseUrl}/contacts/segments`, {
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

      const response = await this.rateLimitedFetch(`${this.baseUrl}/contacts/segments`, {
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

      let totalSynced = 0;
      let totalFailed = 0;
      const totalProfiles = profiles?.length || 0;

      console.log(`📊 Found ${totalProfiles} profiles to sync`);

      for (let i = 0; i < totalProfiles; i++) {
        const profile = profiles[i];
        
        try {
          // Show batch progress
          console.log(`🔄 Processing ${i + 1}/${totalProfiles}: ${profile.email}`);
          
          await this.createContact(profile);
          
          // Mark as synced with timestamp
          await supabase
            .from('profiles')
            .update({ 
              brevo_synced: true,
              brevo_synced_at: new Date().toISOString()
            })
            .eq('id', profile.id);
          
          totalSynced++;
          console.log(`✅ Synced (${totalSynced}/${totalProfiles}): ${profile.email}`);
        } catch (error) {
          totalFailed++;
          console.error(`❌ Failed to sync profile ${profile.id} (${totalFailed} failures):`, error.message);
        }
      }

      console.log(`\n📈 Batch sync completed!`);
      console.log(`   ✅ Successfully synced: ${totalSynced}`);
      console.log(`   ❌ Failed: ${totalFailed}`);
      console.log(`   📊 Total processed: ${totalProfiles}`);
      
      return { synced: totalSynced, failed: totalFailed };
    } catch (error) {
      console.error('❌ Batch sync error:', error);
      throw error;
    }
  }
}

// =============================================
// EXPORT SERVICE INSTANCE
// =============================================

// Validate environment before creating service instance
validateEnvironment();

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

/**
 * Verify webhook signature using HMAC-SHA256
 * @param {object} payload - Webhook payload
 * @param {string} signature - Signature from header
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  try {
    // Validate required parameters
    const secret = process.env.BREVO_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('❌ BREVO_WEBHOOK_SECRET environment variable is not set');
      return false;
    }
    
    if (!signature) {
      console.error('❌ No signature provided in webhook request');
      return false;
    }
    
    // Generate HMAC-SHA256 signature
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    // Ensure buffers are the same length before comparing
    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error('❌ Webhook signature length mismatch');
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isValid) {
      console.error('❌ Webhook signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error.message);
    return false;
  }
}

export default brevoService;