export interface EducationHighlight {
  icon: string;
  value: string;
  label: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  period: string;
  gpa: string;
  courses: string[];
  roles: string[];
  image: string;
  highlights?: EducationHighlight[];
  originStory?: string;
  haiku?: string;
  lore?: string[];
}

export const education: Education[] = [
  {
    id: 'njit',
    degree: 'Master of Science',
    field: 'Data Science',
    institution: 'New Jersey Institute of Technology',
    location: 'Newark, NJ',
    period: 'Sep 2022 – Dec 2023',
    gpa: '3.6 / 4.0',
    highlights: [
      { icon: '🎓', value: '3.6 / 4.0', label: 'GPA' },
      { icon: '📚', value: '3 TA Roles', label: 'Teaching' },
      { icon: '🏙️', value: 'Newark, NJ', label: 'City' },
    ],
    courses: [
      'Big Data',
      'Data Analytics with R',
      'Data Structures',
      'Cloud Computing',
      'Data Mining',
      'Machine Learning',
      'Deep Learning',
      'Applied Statistics',
      'Web Development',
      'Capstone Project',
    ],
    roles: [
      'Teaching Assistant — Big Data',
      'Teaching Assistant — Data Structures',
      'Physics Lab Assistant',
    ],
    image: '/data/MdyGMgwDwxXyEEhR.webp',
  },
  {
    id: 'vtu',
    degree: 'Bachelor of Engineering',
    field: 'Mechanical Engineering',
    institution: 'KLE Dr. M.S. Sheshgiri College of Engineering',
    location: 'Belagavi, Karnataka, India',
    period: 'Aug 2014 – Jul 2018',
    gpa: '3.3 / 4.0',
    highlights: [
      { icon: '✈️', value: '15 RC Planes', label: 'Built from scratch' },
      { icon: '🚀', value: 'IIT Kshitij 2016', label: "KLE's 1st national" },
      { icon: '⚡', value: '72 in 72 hrs', label: 'Workshop signups' },
    ],
    courses: [
      'UAV Design & Development',
      'Engineering Mechanics',
      'Fluid Dynamics',
      'Robotics',
      'Control Systems',
      'Thermodynamics',
      'Industrial Engineering',
      'Manufacturing',
      'CAD/CAM',
      'CFD',
      'Programming in C',
    ],
    roles: [],
    image: '/data/LjExWKoGnNIGZsSA.webp',
  },
];
