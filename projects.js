/**
 * Project pages — single source of truth for all portfolio entries.
 * Add or update projects here; homepage and work roll read the same slugs.
 */
window.PROJECT_PAGES = {
  'precarious-force': {
    slug: 'precarious-force',
    title: 'precarious force',
    statement:
      'The horizontal lever symbolizes the essence of balance, a concept embodied by the scales held by the goddess of justice. In this artwork, however, the unbalanced appearance of the lever challenges this notion, prompting us to reconsider our intuitive understanding. Stereotypes often stem from these intuitive associations we make between groups and their perceived traits, shaped by everyday experiences. By confronting viewers with this unconventional portrayal, the artwork invites introspection into the passive formation of stereotypes. Moreover, feathers are introduced as a subtle yet dynamic element, highlighting the instability inherent in our fixed perceptions.',
    materials: 'Acrylic. Metal. Step motor. Feather',
    dimensions: '3m x 0.2m x 0.4m',
    year: '2022',
    media: {
      photo: [
        { src: '../assets/projects/precarious-force-hero.jpg', alt: 'precarious force installation view' },
        { src: '../assets/projects/precarious-force-01.png', alt: 'precarious force detail' },
      ],
      video: [
        {
          youtube: 's8IcE48qEbI',
          poster: '../assets/projects/precarious-force-hero.jpg',
          alt: 'precarious force video',
        },
      ],
    },
  },
  'above-the-water': {
    slug: 'above-the-water',
    title: 'above the water',
    statement:
      'An exploration of surface, reflection, and the distance between what is seen and what is submerged. The work holds the viewer at the threshold between clarity and obscurity.',
    materials: 'TBD',
    dimensions: 'TBD',
    year: 'TBD',
    media: {
      photo: [{ src: '../assets/projects/precarious-force-hero.jpg', alt: 'above the water placeholder' }],
      video: [],
    },
  },
  exhibition: {
    slug: 'exhibition',
    title: 'exhibition',
    statement:
      'Selected exhibitions, presentations, and public showings. Documentation and dates will be updated as new exhibitions are confirmed.',
    materials: '',
    dimensions: '',
    year: '',
    media: { photo: [], video: [] },
  },
  nector: {
    slug: 'nector',
    title: 'nector',
    statement:
      'A project investigating flow, sweetness, and transformation — how substances and meanings pass between vessels, bodies, and systems.',
    materials: 'TBD',
    dimensions: 'TBD',
    year: 'TBD',
    media: {
      photo: [{ src: '../assets/projects/precarious-force-hero.jpg', alt: 'nector placeholder' }],
      video: [],
    },
  },
  branding: {
    slug: 'branding',
    title: 'branding',
    statement:
      'Identity systems, visual language, and brand narratives developed for clients and self-initiated studies.',
    materials: '',
    dimensions: '',
    year: '',
    media: { photo: [], video: [] },
  },
  river: {
    slug: 'river',
    title: 'you can\u2019t step into the same river twice',
    statement:
      'A related study in change, repetition, and the impossibility of returning to the same moment twice.',
    materials: 'TBD',
    dimensions: 'TBD',
    year: 'TBD',
    media: {
      photo: [
        { src: '../assets/projects/precarious-force-hero.jpg', alt: 'you can\u2019t step into the same river twice' },
      ],
      video: [],
    },
  },
  'trees-in-the-plastic-boxes': {
    slug: 'trees-in-the-plastic-boxes',
    title: 'trees in the plastic boxes',
    statement:
      'Contained nature, artificial soil, and the paradox of growth inside transparent limits. The work questions what survives when environment is reduced to packaging.',
    materials: 'TBD',
    dimensions: 'TBD',
    year: 'TBD',
    media: {
      photo: [{ src: '../assets/projects/precarious-force-hero.jpg', alt: 'trees in the plastic boxes placeholder' }],
      video: [],
    },
  },
  question: {
    slug: 'question',
    title: '<\u2212 ? \u2212>',
    statement:
      'An open index for experiments, notes, and uncategorized work in progress.',
    materials: '',
    dimensions: '',
    year: '',
    media: { photo: [], video: [] },
  },
  contact: {
    slug: 'contact',
    title: 'contact',
    statement: 'For inquiries, collaborations, and studio visits.',
    materials: '',
    dimensions: '',
    year: '',
    contact: 'hello@example.com',
    media: { photo: [], video: [] },
  },
};

window.PROJECT_SLUGS = Object.keys(window.PROJECT_PAGES);
