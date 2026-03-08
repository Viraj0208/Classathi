export type TemplateDefinition = {
  category: "utility" | "marketing" | "authentication";
  language: string;
  body: string;
  params: string[];
};

export const TEMPLATES: Record<string, TemplateDefinition> = {
  fee_reminder: {
    category: "utility",
    language: "en",
    body: "Hi {{1}}, this is a reminder that ₹{{2}} is due for {{3}}'s tuition with {{4}}. Pay here: {{5}}",
    params: ["parent_name", "amount", "student_name", "teacher_name", "payment_link"],
  },
  absent_notification: {
    category: "utility",
    language: "en",
    body: "Hi {{1}}, {{2}} was marked absent from {{3}} class today ({{4}}).",
    params: ["parent_name", "student_name", "batch_name", "date"],
  },
  homework_message: {
    category: "utility",
    language: "en",
    body: "Hi {{1}}, homework for {{2}} ({{3}}): {{4}}",
    params: ["parent_name", "subject", "date", "homework_text"],
  },
  test_notification: {
    category: "utility",
    language: "en",
    body: "Hi {{1}}, upcoming test for {{2}} on {{3}}: {{4}}",
    params: ["parent_name", "subject", "date", "test_details"],
  },
  payment_confirmation: {
    category: "utility",
    language: "en",
    body: "Hi {{1}}, payment of ₹{{2}} received for {{3}}'s tuition. Thank you!",
    params: ["parent_name", "amount", "student_name"],
  },
};

type TemplateComponent = {
  type: string;
  parameters: { type: string; text: string }[];
};

/**
 * Build the `components` array that the Meta WhatsApp Cloud API expects
 * for a given template name and ordered parameter values.
 */
export function buildTemplateComponents(
  templateName: string,
  paramValues: string[]
): TemplateComponent[] {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown WhatsApp template: ${templateName}`);
  }

  if (paramValues.length !== template.params.length) {
    throw new Error(
      `Template "${templateName}" expects ${template.params.length} params, got ${paramValues.length}`
    );
  }

  return [
    {
      type: "body",
      parameters: paramValues.map((value) => ({
        type: "text",
        text: value,
      })),
    },
  ];
}
