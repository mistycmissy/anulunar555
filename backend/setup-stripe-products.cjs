// 

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // sk_live_...

// 
const anulunarSubscriptionTiers = [
  {
    id: 'crescent_moon_entry',
    name: 'Crescent Moon Entry',
    description: 'Gateway Energy - Cosmic Cycle. Access to free reports, quizzes, and cosmic alignment.',
    pricing: { monthly: 0, annual: 0 }, // FREE
    gematria: { standard: 223, reverse: 365, simple: 179 },
    focus: 'Gateway Energy - Cosmic Cycle',
    features: [
      'Access to free reports as they are released & quizzes',
      'Monthly newsletter, special offers',
      'Birthday surprise gifts',
      'Can add friends',
      'Can create up to 4 charts for others (all free)',
      'Access to calendars both 12 + 13 months',
      'Storage of reports'
    ]
  },
  {
    id: 'frequency_initiate',
    name: '🌐 Frequency Initiate',
    description: 'Galactic Drops & Core Frequency. Tuning into higher vibrations with daily cosmic guidance.',
    pricing: { monthly: 555, annual: 6666 }, // $5.55 monthly, $66.66 for 13 months
    gematria: { standard: 230, reverse: 474, simple: 168 },
    focus: 'Galactic Drops & Core Frequency',
    features: [
      'All Level I features',
      'Mini Reading Gift: One $5.55 Mini Numerology or Horoscope Reading',
      'Exclusive monthly promo code for 10% OFF any single service',
      'Private feed: Access to exclusive Ko-fi posts',
      'Daily energy checks and general spiritual guidance',
      'Can create 6 reports for others and save'
    ]
  },
  {
    id: 'lunar_transmutation_tier',
    name: '🌙 Lunar Transmutation Tier',
    description: 'Nervous System Glow & Guided Transmutation. Monthly guided journeys and ritual PDFs.',
    pricing: { monthly: 1888, annual: 21111 }, // $18.88 monthly, $211.11 for 13 months
    gematria: { standard: 361, reverse: 553, simple: 234 },
    focus: 'Nervous System Glow & Guided Transmutation',
    features: [
      'All Levels I + II features',
      'Monthly Guided Journey: Exclusive meditation or breathwork video',
      'Ritual Guide: Monthly PDF for Abundance, Health, or Protection magick',
      'Discount Upgrade: 15% OFF any single service or report',
      'Can select one paid report worth up to $90 per quarter',
      'Can stack reports for the year but must redeem within 13 months'
    ]
  },
  {
    id: 'crystal_clarity_tier',
    name: '🔮 Crystal Clarity Tier',
    description: 'Precision Code Work & Crystal Clarity. Monthly diagnostics with sound healing access.',
    pricing: { monthly: 4444, annual: 52222 }, // $44.44 monthly, $522.22 for 13 months
    gematria: { standard: 243, reverse: 519, simple: 198 },
    focus: 'Precision Code Work & Crystal Clarity',
    features: [
      'All Levels I, II, III features',
      'Monthly Mini Reading: AnuLunar or Chakra Diagnostics mini-reading',
      'Sound Healing Access: Group Sound Bath livestream or Tarot Collective recording',
      'Priority Booking: Priority scheduling for 90 Minute Private Reading ($188) or Sound Bath ($222)',
      'One free sound bath group IRL or VR event attendance per 13 months',
      'Top Discount: 20% OFF any single service or report',
      'Can create up to 8 reports for others'
    ]
  },
  {
    id: 'full_spectrum_circle',
    name: '🌈 Full Spectrum Circle',
    description: 'Full Spectrum Access & Soul-Level Recalibration. VIP access with quarterly group sessions.',
    pricing: { monthly: 9999, annual: 111111 }, // $99.99 monthly, $1111.11 for 13 months
    gematria: { standard: 308, reverse: 596, simple: 228 },
    focus: 'Full Spectrum Access & Soul-Level Recalibration',
    features: [
      'All Levels I, II, III and IV features',
      'Quarterly 45-minute small group private session with Liz Selke',
      'Full content library access',
      'Quarterly VIP group event admission',
      '25% OFF ALL offerings',
      'Can create up to 10 reports for others',
      'Selection of one report under $200 every 13 months',
      'Plus reports from levels below'
    ]
  },
  {
    id: 'high_magick_council',
    name: '✨ High Magick Council',
    description: 'High-Impact Spiritual Intelligence Coaching & Magick. For serious initiates ready for reality shifts.',
    pricing: { monthly: 55500, annual: 511111 }, // $555.00 monthly, $5111.11 for 13 months
    gematria: { standard: 221, reverse: 470, simple: 166 },
    focus: 'High-Impact Spiritual Intelligence Coaching & Magick',
    features: [
      'All Levels I, II, III, IV, V features',
      '2x Quarterly group semi-private sessions with Liz Selke, MistycMissy or Master Zhou',
      'Two dedicated 90-minute private readings/coaching sessions per 13 months',
      'Custom Magick: One complimentary ritual (Abundance, Protection, or Health)',
      'Emergency Access: Priority, expedited access for urgent energetic diagnostics',
      'Annual branded printed 300-page AnuLunar Spiritual Intelligence leather report',
      'Choice of one additional report every 6 months',
      'Can create up to 12 calculations for others'
    ]
  },
  {
    id: 'ascension_patron_order',
    name: '🌟 Ascension Patron Order',
    description: 'Ultimate Full Stack Immersion & Quantum Realignment. Supporting the Wellness Property vision.',
    pricing: { monthly: 225500, annual: 2222222 }, // $2255.00 monthly, $22222.22 for 13 months
    gematria: { standard: 331, reverse: 589, simple: 227 },
    focus: 'Ultimate Full Stack Immersion & Quantum Realignment',
    features: [
      'All Levels I, II, III, IV, V, VI features',
      'Four dedicated 90-minute Full Stack Immersion sessions per quarter',
      'Direct weekly access for energetic checks via private messenger',
      'Exclusive yearly private VIP retreat/ceremony',
      '50% OFF any additional group work, workshops, or reports',
      'Can create up to 13 calculations for others in portal',
      'Direct support for the Holistic Wellness Property vision',
      'Community programming support for all ages'
    ]
  }
];

async function createAccurateAnuLunarProductsLIVE() {
  console.log('🌙✨ CREATING ACCURATE LIVE ANULUNAR PRODUCTS IN STRIPE ✨🌙');
  console.log('⚠️  ATTENTION: This will create REAL products for REAL customers!');
  console.log('🚀 Sacred number pricing tiers going LIVE with correct pricing...\n');
  
  const createdProducts = [];
  
  for (const tier of anulunarSubscriptionTiers) {
    try {
      console.log(`✨ Creating LIVE product: ${tier.name}`);
      
      // Create the product
      const product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: {
          gematria_standard: tier.gematria.standard.toString(),
          gematria_reverse: tier.gematria.reverse.toString(),
          gematria_simple: tier.gematria.simple.toString(),
          tier_id: tier.id,
          focus: tier.focus,
          created_by: 'AnuLunar_V1_Accurate_Launch'
        }
      });
      
      let monthlyPrice = null;
      let annualPrice = null;
      
      // Create monthly price
      if (tier.pricing.monthly > 0) {
        monthlyPrice = await stripe.prices.create({
          unit_amount: tier.pricing.monthly,
          currency: 'cad',
          recurring: { interval: 'month' },
          product: product.id,
          nickname: `${tier.name} - Monthly`,
          metadata: {
            tier_id: tier.id,
            billing_cycle: 'monthly',
            sacred_pricing: 'true'
          }
        });
        console.log(`   📅 Monthly: $${(tier.pricing.monthly / 100).toFixed(2)} CAD`);
      } else {
        // For free tier, create a price of $0
        monthlyPrice = await stripe.prices.create({
          unit_amount: 0,
          currency: 'cad',
          recurring: { interval: 'month' },
          product: product.id,
          nickname: `${tier.name} - FREE Gateway`,
          metadata: {
            tier_id: tier.id,
            billing_cycle: 'free',
            sacred_pricing: 'true'
          }
        });
        console.log(`   📅 Monthly: FREE - Gateway Energy`);
      }
      
      // Create annual price (13 months sacred cycle)
      if (tier.pricing.annual > 0) {
        annualPrice = await stripe.prices.create({
          unit_amount: tier.pricing.annual,
          currency: 'cad',
          recurring: { interval: 'year' },
          product: product.id,
          nickname: `${tier.name} - Annual (13 Moon Cycles)`,
          metadata: {
            tier_id: tier.id,
            billing_cycle: 'annual_13_moons',
            sacred_pricing: 'true'
          }
        });
        console.log(`   🌙 Annual (13 Moons): $${(tier.pricing.annual / 100).toFixed(2)} CAD`);
      }
      
      createdProducts.push({
        tier: tier.id,
        product: product,
        monthlyPrice: monthlyPrice,
        annualPrice: annualPrice,
        name: tier.name
      });
      
      console.log(`   ✅ ${tier.name} is now LIVE with accurate pricing!\n`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error creating ${tier.name}:`, error.message);
    }
  }
  
  console.log('🎉🌙 ACCURATE ANULUNAR TIERS ARE LIVE! 🌙🎉');
  console.log('🔗 View your products: https://dashboard.stripe.com/products');
  console.log('\n💫 Complete Sacred Number Pricing Structure:');
  console.log('   🌙 Crescent Moon Entry: FREE');
  console.log('   🌐 Frequency Initiate: $5.55/$66.66');
  console.log('   🌙 Lunar Transmutation: $18.88/$211.11');
  console.log('   🔮 Crystal Clarity: $44.44/$522.22');
  console.log('   🌈 Full Spectrum Circle: $99.99/$1111.11');
  console.log('   ✨ High Magick Council: $555/$5111.11');
  console.log('   🌟 Ascension Patron Order: $2255/$22222.22');
  console.log('\n🏛️ Ascension Patron Order will fund your $4,500/month Wellness Property!');
  console.log('🎯 From FREE gateway to $2,255 community sanctuary funding!');
  
  return createdProducts;
}

// Warning before execution
console.log('⚠️  PRODUCTION WARNING: This script creates REAL products with REAL pricing!');
console.log('🌙 All 7 AnuLunar sacred number tiers will be available for purchase immediately.');
console.log('✨ Accurate pricing: FREE to $2,255/month with 13-moon annual cycles.');
console.log('🚀 Ready to launch your complete spiritual intelligence platform?\n');

// Run the setup
createAccurateAnuLunarProductsLIVE().catch(console.error);
