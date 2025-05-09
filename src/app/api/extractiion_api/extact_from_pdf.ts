// // /pages/api/extract-jd.ts
// import { NextApiRequest, NextApiResponse } from "next";
// import fs from "fs";
// // import pdf from "pdf-parse";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { pdfPath } = req.body;

//   if (!pdfPath) return res.status(400).json({ error: "PDF path not provided" });

//   const dataBuffer = fs.readFileSync(pdfPath);
// //   const text = (await pdf(dataBuffer)).text;

//   //  Use regex or NLP to extract key info
//   const jobTitleMatch = text.match(/(?<=Position:|Title:)\s*(.+)/i);
//   const companyMatch = text.match(/(?<=Company:)\s*(.+)/i);
//   const skillsMatch = text.match(/(?<=Skills Required:|Core Skills:)([\s\S]*?)(?=Responsibilities:|Requirements:)/i);
//   const descMatch = text.match(/(?<=Job Description:|Role Overview:)([\s\S]*?)(?=Skills Required:|Requirements:)/i);

//   const structuredJD = {
//     company: companyMatch?.[1]?.trim() ?? "Unknown",
//     title: jobTitleMatch?.[1]?.trim() ?? "AI Specialist",
//     description: descMatch?.[1]?.trim() ?? "",
//     skills: skillsMatch?.[1]?.trim() ?? "",
//   };

//   res.status(200).json(structuredJD);
// }
