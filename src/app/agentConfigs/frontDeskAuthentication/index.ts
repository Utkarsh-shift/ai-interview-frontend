
import tourAgent from "./tourGuide";
import sde_specialist from "./SoftwareDevelopement";
import Digital_Marketing from "./Digital_marketing";
import Ai_specialist from "./AI";
import { injectTransferTools } from '../utils';
import { injectInterviewConclusionTool } from '../utils';
import { injectAnswerCompletionTools } from "../utils";

import Business_development from "./Business_development";
import IT_admin from "./IT_admin";
import Web_development from "./Web_development";
import AI_Design from "./AI_Design";
import Php_developer from "./Php_develpoer";
import UI_UX from "./UX";
import QA_Analyst from "./QA_Analyst";  
// import  generic_agent  from "./Generic_Prompt";


interface JobDetails {
  title: string;
  description: string;
  skills: string;
  behavioralSkills: string[];
  industry: string;
  minExperience: string;
  maxExperience: string;
}



async function getAgents() {

  const selectedLanguage = "en";
  const QA_Agent = QA_Analyst(selectedLanguage);
  const UI_UXAgent = UI_UX(selectedLanguage, 5);
  const Php_Agent = Php_developer(selectedLanguage,6);
  const Business_development_Agent = Business_development(selectedLanguage);
  const digital_Marketing_Agent = Digital_Marketing(selectedLanguage);
  const Software_development_Engineer_Agent = sde_specialist(selectedLanguage);
  const Artificial_Intelligence_Agent = Ai_specialist(selectedLanguage,7);
  const IT_Agent = IT_admin(selectedLanguage);
  const Web_development_Agent = Web_development(selectedLanguage);
  const Graphic_Creative_Design_Agent = AI_Design(selectedLanguage);



  let agents = injectTransferTools([
    Artificial_Intelligence_Agent,
    QA_Agent,
    Web_development_Agent,
    Software_development_Engineer_Agent,
    tourAgent,
    Graphic_Creative_Design_Agent,
    IT_Agent,
    Php_Agent,
    // generic_agent,
    UI_UXAgent,
    Business_development_Agent,
    digital_Marketing_Agent,
  ]);
  
  agents = injectInterviewConclusionTool(agents);
  agents = injectAnswerCompletionTools(agents);

  return agents;
}

export default getAgents;
