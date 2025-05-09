// 'use client';

// import App from '@/app/App';
// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';

// interface StudentProfileProps {
//   token: "token1e23445";
//   studentId: "15655";
// }

// const StudentProfile = ({ token, studentId }: StudentProfileProps) => {
//   const [studentData, setStudentData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchStudentData = async () => {
//       try {
//         const response = await fetch(`http://localhost:5051/api/student/${token}/`);
//         const data = await response.json();
//         if (response.ok) {
//           setStudentData(data);
//         } else {
//           setError('Student not found');
//         }
//       } catch (err) {
//         setError('Error fetching student data');
//       }
//     };

//     fetchStudentData();
//   }, [token]);

//   if (error) return <div>{error}</div>;
//   if (!studentData) return <div>Loading interview...</div>;

//   return (
//     <div>
//       <h2>Starting interview for: {studentData.student_name}</h2>
//       <p>Student ID from query: {studentId}</p>
//       <App token={token} studentId={studentId} />
//     </div>
//   );
// };

// export default StudentProfile;
