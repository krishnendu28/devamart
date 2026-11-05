import Icon from './Icons';

export const WHATSAPP_NUMBER = '919038150556';

/**
 * WhatsApp chat entry point. Uses the official wa.me click-to-chat API so the
 * customer lands directly in a WhatsApp conversation with +91 90381 50556.
 */
export function whatsappLink(message) {
  const text = message || 'Namaste DevaMart! I have a question about your puja products.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function WhatsAppButton({ productName }) {
  const label = productName
    ? `Namaste DevaMart! I am interested in "${productName}". Please share details.`
    : undefined;

  return (
    <a
      className="wa-fab"
      href={whatsappLink(label)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with DevaMart on WhatsApp"
      title="Chat on WhatsApp · +91 90381 50556"
    >
      <Icon name="chat" size={24} />
      <span className="wa-fab-label">WhatsApp</span>
    </a>
  );
}
