
'use server';

/**
 * @fileOverview A service for sending notifications.
 *
 * In a real application, this would integrate with a push notification service
 * like Firebase Cloud Messaging (FCM) to send notifications to mobile devices.
 * For this demo, we are simulating the action by logging to the console.
 */

/**
 * Sends a simulated attendance notification.
 * @param personId The ID of the staff member or student.
 * @param name The name of the person.
 * @param status The attendance status (e.g., "Clocked In", "Clocked Out", "Arrived", "Departed").
 */
export async function sendAttendanceNotification(personId: string, name: string, status: string): Promise<void> {
  const isStudent = personId.startsWith('ST-');
  const recipientType = isStudent ? 'Parent' : 'Employee';
  
  const message = isStudent
    ? `Dear Parent, ${name}'s attendance has been logged. Status: ${status}.`
    : `Hi ${name}, your attendance has been logged. Status: ${status}.`;

  console.log(`--- SIMULATING PUSH NOTIFICATION ---`);
  console.log(`To: ${recipientType} of ${name} (ID: ${personId})`);
  console.log(`Message: ${message}`);
  console.log(`-----------------------------------`);

  // In a real implementation, you would use a service like FCM here.
  // Example:
  // const userDeviceToken = await getUserDeviceToken(personId); // A function to get the device token from your database
  // if (userDeviceToken) {
  //   await fcm.send({ token: userDeviceToken, notification: { title: 'Attendance Logged', body: message } });
  // }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
}
