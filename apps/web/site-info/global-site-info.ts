import { Service } from "@/types/global-types";

export const menu_names: Array<string> = [
  "about",
  "work",
  "originals",
  "contact",
];

export const clientPortalNav = {
  label: "Client Portal",
} as const;

/** URL flag while the client portal login overlay is open (e.g. /about?client-portal) */
export const clientPortalQueryParam = "client-portal";

const menuLabels: Record<string, string> = {
  contact: "Contact",
};

export function getMenuLabel(slug: string): string {
  return menuLabels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

const whatWeDoVideo = (filename: string) => `/videos/what-we-do/${filename}`;

export const services: Array<{ [key: string]: Service }> = [
  {
    brand_strategy: {
      title: "Brand Strategy",
      description: [
        "A strong brand is built around a clear idea of who you are, why you matter and what you want to be known for.",
        "Our strategy process looks beyond the brief. We spend time understanding your business, your customers, your competitors and your ambitions before making recommendations.",
        "That work becomes the foundation for everything that follows, ensuring every campaign, message and customer interaction reinforces the same story.",
      ],
      previewVideo: whatWeDoVideo("brand_service.mp4"),
    },
    campaign_development: {
      title: "Campaign Development",
      description: [
        "A campaign should move a business forward.",
        "We develop ideas that respond to specific commercial objectives, whether that's introducing a new product, shifting public perception, increasing market share or strengthening customer loyalty.",
        "Every recommendation is grounded in strategy, then adapted across the channels where we believe it will have the greatest impact.",
      ],
      // Temporary: reuse brand preview until a dedicated campaign hover video is added
      previewVideo: whatWeDoVideo("brand_service.mp4"),
    },
    digital_service: {
      title: "Digital Products",
      description: [
        "We turn your business needs into digital products — web apps, intranets, and mobile experiences your team and customers will actually love using.",
      ],
      previewVideo: whatWeDoVideo("digital_service.webm"),
    },
    production_studio: {
      title: "Production / Studio",
      description: [
        "Production is where planning meets execution.",
        "From scripts and storyboards to casting, locations, photography, editing and final delivery, we manage every stage of the process with the same attention to detail that shaped the original idea.",
        "From pre-production to editing, our focus is creating work that reflects the quality of our clients’ work.",
      ],
      previewVideo: whatWeDoVideo("production_studio.mp4"),
    },
    pr_communication: {
      title: "PR & Communications",
      description: [
        "Perception is ever shifting and changing.",
        "We help clients communicate through growth, change, launches and important milestones with clear, considered messaging.",
        "Our work spans media relations, executive communications, stakeholder engagement, internal communications and reputation management, ensuring the right audience receives the right message at the right time.",
      ],
      previewVideo: whatWeDoVideo("pr_communication.webm"),
    },
    talent: {
      title: "Talent",
      description: [
        "The person delivering your message is just as important as the message itself.",
        "We represent a diverse roster of talent, including some of the Caribbean most respected media personalities, connecting brands with talent who can strengthen campaigns, and create meaningful engagement.",
        "We manage the relationship from start to finish, making collaboration seamless for both brands and talent.",
      ],
      previewVideo: whatWeDoVideo("talent.mp4"),
    },
    analytics: {
      title: "Analytics & Insights",
      description: [
        "We use data-driven insights to inform strategies and measure success, keeping you future-ready.",
      ],
      previewVideo: whatWeDoVideo("analytics.webm"),
    },
  },
];
