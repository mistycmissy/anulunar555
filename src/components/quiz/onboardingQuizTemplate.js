export const onboardingQuizTemplate = {
  id: 'onboarding_cosmic_blueprint_v1',
  title: 'Cosmic Blueprint Foundation Quiz',
  description:
    'Gathering your essential cosmic data to create your personalized spiritual profile',
  sections: [
    {
      id: 'basic_cosmic_data',
      title: 'Basic Cosmic Data',
      questions: [
        {
          id: 'first_name',
          type: 'text',
          question: 'What is your first name?',
          required: true,
          placeholder: 'First name',
        },
        {
          id: 'last_name',
          type: 'text',
          question: 'What is your last name?',
          required: true,
          placeholder: 'Last name',
        },
        {
          id: 'email',
          type: 'email',
          question: 'Where should we send your mini cosmic reading?',
          required: true,
          placeholder: 'you@example.com',
        },
        {
          id: 'birth_date',
          type: 'date',
          question: 'What is your birth date?',
          required: true,
          spiritual_note:
            "This connects you to the cosmic energies present at your soul's arrival",
        },
        {
          id: 'birth_time',
          type: 'time',
          question: 'What time were you born? (HH:MM)',
          required: true,
          spiritual_note:
            'Your birth time reveals your rising sign — how your soul chose to present to the world',
        },
        {
          id: 'birth_location',
          type: 'text',
          question: 'Where were you born? (City, State/Province, Country)',
          required: false,
          placeholder: 'Toronto, Ontario, Canada',
          spiritual_note: 'Your birthplace anchors your chart to specific Earth energies',
        },
        {
          id: 'birth_country',
          type: 'text',
          question: 'What country were you born in?',
          required: true,
          placeholder: 'Canada',
        },
        {
          id: 'marketing_consent',
          type: 'consent',
          question:
            'I consent to receive email guidance, updates, and offers from AnuLunar (you can unsubscribe anytime).',
          required: true,
        },
      ],
    },
    {
      id: 'spiritual_background',
      title: 'Spiritual Background',
      questions: [
        {
          id: 'spiritual_experience',
          type: 'multiple_choice',
          question: 'How would you describe your spiritual journey so far?',
          required: true,
          options: [
            'Just beginning to explore spirituality',
            'Have some experience with spiritual practices',
            'Deeply involved in spiritual study and practice',
            'Experienced practitioner helping others on their path',
            'Spiritual teacher or professional guide',
          ],
        },
        {
          id: 'modality_familiarity',
          type: 'checkbox',
          question:
            'Which spiritual modalities are you familiar with? (Check all that apply)',
          required: false,
          options: [
            'Astrology',
            'Numerology',
            'Tarot/Oracle Cards',
            'Human Design',
            'Meditation/Mindfulness',
            'Energy Healing (Reiki, etc.)',
            'Crystal Work',
            'Celtic/Nature Spirituality',
            'Chakra Work',
            'Sound Healing',
            "None of the above - I'm new to this!",
          ],
        },
      ],
    },
    {
      id: 'energy_sensitivity',
      title: 'Energy Sensitivity',
      questions: [
        {
          id: 'intuitive_abilities',
          type: 'scale',
          question: 'How strongly do you feel your intuitive abilities?',
          required: false,
          scale: {
            min: 1,
            max: 10,
            labels: {
              1: 'I rarely trust my gut feelings',
              5: 'Sometimes I get strong intuitive hits',
              10: 'I rely heavily on my intuition for major decisions',
            },
          },
        },
        {
          id: 'energy_sensitivity',
          type: 'multiple_choice',
          question: "How do you experience other people's energies?",
          required: false,
          options: [
            "I don't really notice energy from others",
            "I sometimes pick up on moods but it's subtle",
            'I often feel overwhelmed in crowds or with certain people',
            "I can immediately sense someone's emotional state",
            "I absorb others' emotions as if they were my own",
          ],
        },
        {
          id: 'moon_sensitivity',
          type: 'multiple_choice',
          question: 'How does the moon affect you?',
          required: false,
          options: [
            "I don't notice any moon effects",
            "I've heard about moon effects but don't track them",
            'I notice some changes around full moons',
            "I'm very aware of moon phases and plan around them",
            'The moon dramatically affects my energy, sleep, and emotions',
          ],
        },
      ],
    },
    {
      id: 'sacred_number_resonance',
      title: 'Sacred Number Resonance',
      questions: [
        {
          id: 'favorite_numbers',
          type: 'text',
          question:
            'Do you have any numbers that feel especially meaningful to you? (List up to 3)',
          required: false,
          placeholder: 'e.g. 8, 11, 444',
          spiritual_note:
            "Numbers that call to us often reflect our soul's vibrational signature",
        },
        {
          id: 'number_patterns',
          type: 'checkbox',
          question: 'Do you notice any of these number patterns in your life?',
          required: false,
          options: [
            'Repeating numbers (11:11, 222, etc.)',
            'Same numbers appearing everywhere',
            'Birthdate numbers showing up frequently',
            "Certain numbers feeling 'lucky' or significant",
            'Numbers in dreams or meditation',
            'None of the above',
          ],
        },
      ],
    },
    {
      id: 'spiritual_preferences',
      title: 'Spiritual Style & Preferences',
      questions: [
        {
          id: 'guidance_preference',
          type: 'multiple_choice',
          question: 'What type of spiritual guidance resonates most with you?',
          required: false,
          options: [
            'Practical, actionable steps I can implement daily',
            'Deep, mystical insights that expand my consciousness',
            'Gentle encouragement and emotional support',
            'Direct, challenging truth that pushes growth',
            'Poetic, metaphorical language that speaks to my soul',
          ],
        },
        {
          id: 'spiritual_practice_style',
          type: 'multiple_choice',
          question: 'Which spiritual practice style appeals to you most?',
          required: false,
          options: [
            'Structured daily routines and rituals',
            'Spontaneous, intuition-led practices',
            'Group ceremonies and community gatherings',
            'Solo meditation and inner work',
            'Nature-based and earth-connected practices',
          ],
        },
      ],
    },
  ],
}

