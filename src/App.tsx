import AssistantWidget from "./components/AssistantWidget";

const docs = [
  {
    title: "Billing and payments",
    content: `
      Your subscription renews automatically every month on the date you signed up.
      We accept Visa, Mastercard, and PayPal.
      To update your payment method go to Settings → Billing.
      If a payment fails we retry 3 times over 5 days before cancelling.
    `,
  },
  {
    title: "Resetting your password",
    content: `
      To reset your password click Forgot Password on the login screen.
      You will receive an email with a reset link valid for 24 hours.
      If you don't receive the email check your spam folder.
    `,
  },
  {
    title: "Exporting your data",
    content: `
      You can export all your data as a CSV from Settings → Export.
      Exports are processed in the background and emailed to you when ready.
      Large exports may take up to 10 minutes.
    `,
  },
];

function App() {
  return (
    <AssistantWidget
    
      model="gemma3"
      systemPrompt="You are a support assistant for Acme App."
      accentColor="#6366f1"
      position="bottom-right"
      title="Assistant"
      knowledgeBase={docs}
    />
  );
}

export default App;
