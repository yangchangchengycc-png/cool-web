/**
 * Project pages — single source of truth for all portfolio entries.
 * Add or update projects here; homepage and work roll read the same slugs.
 */
window.PROJECT_PAGES = {
  'precarious-force': {
    slug: 'precarious-force',
    title: 'precarious force',
    statement:
      'A study of unstable equilibrium and the tension between support and collapse. Structural elements appear poised on the edge of failure, asking whether balance is an achievement or a temporary illusion.',
    materials: 'Mixed media',
    dimensions: 'TBD',
    year: '2024',
    media: {
      photo: [
        { src: '../assets/projects/precarious-force-hero.jpg', alt: 'precarious force installation view' },
        { src: '../assets/projects/precarious-force-01.png', alt: 'precarious force detail' },
      ],
      video: [],
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
      'Using balance as the primary language, this artwork explores the conflict between the weight of reality and the lightness of ideals. Like the classical imagery of the goddess of justice, balance here does not settle contradictions, but exposes their coexistence. A feather is chosen not merely for its lightness, but for the specific weight it represents\u2014appearing close to the earth while pointing toward the sky, it operates along the fault line between lightness and heaviness, ideal and reality, visible forces and hidden systems.',
    materials: 'Acrylic. Metal. Step motor. Feather',
    dimensions: '3m x 0.2m x 0.4m',
    year: '2022',
    media: {
      photo: [
        { src: '../assets/projects/precarious-force-hero.jpg', alt: 'you can\u2019t step into the same river twice' },
        { src: '../assets/projects/precarious-force-01.png', alt: 'you can\u2019t step into the same river twice detail' },
      ],
      video: [
        {
          youtube: 's8IcE48qEbI',
          poster: '../assets/projects/precarious-force-hero.jpg',
          alt: 'you can\u2019t step into the same river twice video',
        },
      ],
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
