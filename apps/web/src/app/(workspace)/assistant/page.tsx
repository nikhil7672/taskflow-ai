import { PageHeading } from '@/components/shared/page-heading';
import { AssistantChat } from '@/components/assistant/assistant-chat';

export default function AssistantPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Your thinking partner"
        title="AI assistant"
        description="Get a little help turning context into a clear next step."
      />
      <AssistantChat />
    </div>
  );
}
