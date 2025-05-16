
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


async function getAgents() {
  const selectedLanguage = "English";

  const agentsMap = {
    Ai_specialist: Ai_specialist(selectedLanguage, 7),
    Business_development: Business_development(selectedLanguage),
    Digital_Marketing: Digital_Marketing(selectedLanguage),
    QA_Analyst: QA_Analyst(selectedLanguage),
    Web_development: Web_development(selectedLanguage),
    SoftwareDevelopement: sde_specialist(selectedLanguage),
    AI_Design: AI_Design(selectedLanguage),
    IT_admin: IT_admin(selectedLanguage),
    Php_developer: Php_developer(selectedLanguage, 6),
    UI_UX: UI_UX(selectedLanguage, 5),
    tourAgent,
  };

  let agents = injectTransferTools(Object.values(agentsMap));
  agents = injectInterviewConclusionTool(agents);
  agents = injectAnswerCompletionTools(agents);

  return { agentsList: agents, agentsMap };
}

export default getAgents;

