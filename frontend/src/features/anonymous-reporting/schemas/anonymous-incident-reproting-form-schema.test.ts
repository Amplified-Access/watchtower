import { descriptionSchema } from "./anonymous-incident-reproting-form-schema";

const requiredMessage = "Describe what happened or record a voice note.";

describe("descriptionSchema", () => {
  it("needs at least 10 characters without a voice note", () => {
    const schema = descriptionSchema({ hasVoiceNote: false, requiredMessage });
    expect(schema.safeParse("").error?.issues[0].message).toBe(requiredMessage);
    // Spaces don't count towards the 10.
    expect(schema.safeParse("   short   ").success).toBe(false);
    expect(schema.safeParse("The road has been blocked since Monday").success).toBe(true);
  });

  it("is optional with a voice note", () => {
    const schema = descriptionSchema({ hasVoiceNote: true, requiredMessage });
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("Fire").success).toBe(true);
  });

  it("caps the length either way", () => {
    const long = "a".repeat(2001);
    expect(descriptionSchema({ hasVoiceNote: true, requiredMessage }).safeParse(long).success).toBe(false);
    expect(descriptionSchema({ hasVoiceNote: false, requiredMessage }).safeParse(long).success).toBe(false);
  });

  it("trims what it returns", () => {
    expect(descriptionSchema({ hasVoiceNote: true, requiredMessage }).parse("  Fire  ")).toBe("Fire");
  });
});
