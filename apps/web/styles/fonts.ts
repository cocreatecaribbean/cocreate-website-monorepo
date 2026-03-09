// styles/fonts.ts
import { Bricolage_Grotesque, Ysabeau_Infant } from "next/font/google";

// You MUST include subsets: ['latin'] for Google Fonts to work
const bricolage_grot300 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '300', 
  variable: '--font-brico-300' 
});

const bricolage_grot400 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '400', 
  variable: '--font-brico-400' 
});

const bricolage_grot500 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '500', 
  variable: '--font-brico-500' 
});

const bricolage_grot600 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '600', 
  variable: '--font-brico-600' 
});

const bricolage_grot700 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '700', 
  variable: '--font-brico-700' 
});

const bricolage_grot800 = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  weight: '800', 
  variable: '--font-brico-800' 
});
const ysabeau_infant900 = Ysabeau_Infant({ 
  subsets: ['latin'], 
  weight: '900', 
  variable: '--font-ysabeau-900' 
});

export { 
  bricolage_grot300, 
  bricolage_grot400, 
  bricolage_grot500, 
  bricolage_grot600, 
  bricolage_grot700, 
  bricolage_grot800,
  ysabeau_infant900
};