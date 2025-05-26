import tourAgent from "./tourGuide";
import sde_specialist from "./SoftwareDevelopement";
import Digital_Marketing from "./Digital_marketing";
import Ai_specialist from "./AI";

import Business_development from "./Business_development";
import IT_admin from "./IT_admin";
import Web_development from "./Web_development";
import AI_Design from "./AI_Design";
import Php_developer from "./Php_develpoer";
import UI_UX from "./UX";
import QA_Analyst from "./QA_Analyst";  
import Generic_Agent from "./Generic_Prompt";

async function getAgents() {
  const selectedLanguage = "English";

  // Await each agent if it's async
  const agentsMap = {
    Ai_specialist: await Ai_specialist(selectedLanguage, 7),
    Business_development: await Business_development(selectedLanguage),
    Digital_Marketing: await Digital_Marketing(selectedLanguage),
    QA_Analyst: await QA_Analyst(selectedLanguage),
    Web_development: await Web_development(selectedLanguage),
    SoftwareDevelopement: await sde_specialist(selectedLanguage),
    Generic_Agent: await Generic_Agent(selectedLanguage),
    AI_Design: await AI_Design(selectedLanguage),
    IT_admin: await IT_admin(selectedLanguage),
    Php_developer: await Php_developer(selectedLanguage, 6),
    UI_UX: await UI_UX(selectedLanguage, 5),
    tourAgent: tourAgent, // assumed to be already resolved
  };

  const agentsList = Object.values(agentsMap); // Now: AgentConfig[]

  return { agentsList, agentsMap };
}

export default getAgents;
