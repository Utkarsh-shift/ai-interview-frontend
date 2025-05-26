import { AgentConfig, Tool } from "../types";

export function injectTransferTools(agentDefs: AgentConfig[]): AgentConfig[] { 
  agentDefs.forEach((agentDef) => {
    const downstreamAgents = agentDef.downstreamAgents || [];
    if (downstreamAgents.length > 0) {
      const availableAgentsList = downstreamAgents
        .map(
          (dAgent) =>
            `- ${dAgent.name}: ${dAgent.publicDescription ?? "No description"}`
        )
        .join("\n");
      const transferAgentTool: Tool = {
        type: "function",
        name: "transferAgents",
        description: `Triggers a transfer of the user to a more specialized agent. 
  Calls escalate to a more specialized LLM agent or to a human agent, with additional context. 
  Only call this function if one of the available agents is appropriate. Don't transfer to your own agent type.
  Let the user know you're about to transfer them before doing so.
  Available Agents:
  ${availableAgentsList}
        `,
        parameters: {
          type: "object",
          properties: {
            rationale_for_transfer: {
              type: "string",
              description: "The reasoning why this transfer is needed.",
            },
            conversation_context: {
              type: "string",
              description:
                "Relevant context from the conversation that will help the recipient perform the correct action.",
            },
            destination_agent: {
              type: "string",
              description:
                "The more specialized destination_agent that should handle the user’s intended request.",
              enum: downstreamAgents.map((dAgent) => dAgent.name),
            },
          },
          required: [
            "rationale_for_transfer",
            "conversation_context",
            "destination_agent",
          ],
        },
      };
      if (!agentDef.tools) {
        agentDef.tools = [];
      }
      agentDef.tools.push(transferAgentTool);
    }
    agentDef.downstreamAgents = agentDef.downstreamAgents?.map(
      ({ name, publicDescription }) => ({
        name,
        publicDescription,
      })
    );
  });
  return agentDefs;
}

export function injectInterviewConclusionTool(agentDefs: AgentConfig[]): AgentConfig[] {
  agentDefs.forEach((agentDef) => {
    const interviewConclusionTool: Tool = {
      type: "function",
      name: "concludeInterview",
      description: `Formally concludes the interview session. 
      The AI should summarize key points discussed and provide a polite closing statement.
      Only call this function when the interview is logically complete and there are no further questions to ask.`,
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "A brief summary of the interview session, including key discussion points.",
          },
          closing_statement: {
            type: "string",
            description: "A polite closing statement to formally end the interview session.",
          }
        },
        required: [],
      }
    };

    if (!agentDef.tools) {
      agentDef.tools = [];
    }

    agentDef.tools.push(interviewConclusionTool);
  });

  return agentDefs;
}


// export function injectAnswerCompletionTools(agentDefs: AgentConfig[]): AgentConfig[] {
 
//   agentDefs.forEach((agentDef) => {
    
//     const answerCompletionTool: Tool = {
//       type: "function",
//       name: "detectAnswerCompletion",
//       description: `Determines if the user has completed answering a question.
//   This tool analyzes the user's response and detects whether they have finished their input or if they might need prompting to continue.
//   Only call this function when a response is being evaluated to check for completeness.
//   `,
//       parameters: {
//         type: "object",
//         properties: {
//           user_response: {
//             type: "string",
//             description: "The user's current response that needs to be evaluated.",
//           },
//           conversation_context: {
//             type: "string",
//             description:
//               "Relevant context from the conversation that will help in determining whether the user has completed their response.",
//           },
//         },
//         required: ["user_response", "conversation_context"],
//       },
//     };

//     if (!agentDef.tools) {
//       agentDef.tools = [];
//     }

//     agentDef.tools.push(answerCompletionTool);
//   });

//   return agentDefs;
// }


export function injectEnvironmentCheckTool(agentDefs: AgentConfig[]): AgentConfig[] {
  agentDefs.forEach((agentDef) => {
    const environmentCheckTool: Tool = {
      type: "function",
      name: "checkEnvironment",
      description: `Analyzes the candidate's environment during the interview.
      This includes assessing background noise, lighting conditions, and overall ambiance.
      The AI should provide a detailed report on the environment's impact on the interview process.`,
      parameters: {
        type: "object",
        properties: {
          image_url: {
            type: "string",
            description: "A URL or base64-encoded image of the candidate's environment.",
          },
          noise_level: {
            type: "string",
            enum: ["low", "moderate", "high"],
            description: "The level of background noise detected in the environment.",
          },
          lighting_condition: {
            type: "string",
            enum: ["poor", "adequate", "excellent"],
            description: "The quality of lighting in the candidate's environment.",
          },
          distractions: {
            type: "string",
            description: "Any notable distractions or elements that might affect the interview.",
          }
        },
        required: ["image_url", "noise_level", "lighting_condition"],
      }
    };

    if (!agentDef.tools) {
      agentDef.tools = [];
    }

    agentDef.tools.push(environmentCheckTool);
  });

  return agentDefs;
}
