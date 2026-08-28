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
    id: 'mock-education-1',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    institution: 'Mock Education 1: State University',
    location: 'Anytown, USA',
    period: 'Aug 2016 – May 2020',
    gpa: '3.5 / 4.0',
    highlights: [
      { icon: '🎓', value: '3.5 / 4.0', label: 'GPA' },
      { icon: '💻', value: '2 Internships', label: 'Experience' },
      { icon: '🏙️', value: 'Anytown, USA', label: 'City' },
    ],
    courses: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Databases',
      'Computer Networks',
      'Machine Learning',
      'Software Engineering',
    ],
    roles: ['Teaching Assistant — Intro to Programming'],
    image: '/data/mock-education-1.svg',
  },
  {
    id: 'njit',
    degree: 'Master of Science',
    field: 'Data Science',
    institution: 'ReferenceEducation: New Jersey Institute of Technology',
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
];
