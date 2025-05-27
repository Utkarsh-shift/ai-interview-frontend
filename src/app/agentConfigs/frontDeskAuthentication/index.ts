
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

  const response = localStorage.getItem("studentData");
  let agentName = null;

  if (response) {
    try {
      const studentData = JSON.parse(response);
      agentName = studentData.agent;
      console.log(" Agent Name from studentData:", agentName);
    } catch (error) {
      console.error("Failed to parse studentData:", error);
    }
  } else {
    console.warn("No studentData found in localStorage");
  }

  if (!agentName) {
    console.warn(" No agent specified in studentData — using fallback Generic_Agent");
    agentName = "Generic_Agent";
  }


  const agentFactories: Record<string, () => Promise<any>> = {
    Business_development: () => Promise.resolve(Business_development(selectedLanguage)),
    Generic_Agent: () => Promise.resolve(Generic_Agent(selectedLanguage)),
    Ai_specialist: () => Promise.resolve(Ai_specialist(selectedLanguage)),
    Digital_Marketing: () => Promise.resolve(Digital_Marketing(selectedLanguage)),
    Quality_analyst: () => Promise.resolve(QA_Analyst(selectedLanguage)),
    Web_development: () => Promise.resolve(Web_development(selectedLanguage)),
    SoftwareDevelopement: () => Promise.resolve(sde_specialist(selectedLanguage)),
    AI_Design: () => Promise.resolve(AI_Design(selectedLanguage)),
    IT_admin: () => Promise.resolve(IT_admin(selectedLanguage)),
    Php_developer: () => Promise.resolve(Php_developer(selectedLanguage)),
    UI_UX: () => Promise.resolve(UI_UX(selectedLanguage)),
  };

  if (!(agentName in agentFactories)) {
    console.warn(` Agent "${agentName}" not found — defaulting to Generic_Agent`);
    agentName = "Generic_Agent";
  }

  const selectedAgent = await agentFactories[agentName]();

  const agentsMap = {
    [agentName]: selectedAgent,
  };

  const agentsList = [selectedAgent];

  return { agentsMap, agentsList };
}

export default getAgents;
