import { afterEach, describe, expect, it } from "vitest";
import { saveOnboarding } from "./profile";
import { setSupabaseClientForTests } from "./supabaseClient";
import { createFakeSupabase } from "./testing/fakeSupabase";

afterEach(() => {
  setSupabaseClientForTests(null);
});

describe("saveOnboarding column grants", () => {
  it("updates the granted columns and never sends id in the SET list", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "pat@t.test", password: "long enough pw", options: { data: { first_name: "Pat" } } });
    const uid = fake.session!.user.id;

    const profile = await saveOnboarding({ day_to_day: "most_days" }, "knees", { ageRange: "60–70" });
    expect(profile).toMatchObject({ id: uid, focusArea: "knees", ageRange: "60–70", firstName: "Pat" });
    expect(profile.onboardedAt).toBeTruthy();
    expect(fake.profileWrites).toEqual([{ op: "update", keys: ["focus_area", "plan_start_date", "onboarded_at", "age_range"] }]);
    expect(fake.profileWrites.every((write) => !write.keys.includes("id"))).toBe(true);

    const touchedId = await fake.client.from("profiles").update({ id: uid, focus_area: "hips_balance" }).eq("id", uid);
    expect(touchedId.error).toMatchObject({ code: "42501" });
    const money = await fake.client.from("profiles").update({ subscription_status: "active" }).eq("id", uid);
    expect(money.error).toMatchObject({ code: "42501" });
    const stripe = await fake.client.from("profiles").upsert({ id: uid, email: "other@t.test" }, { onConflict: "id" });
    expect(stripe.error).toMatchObject({ code: "42501" });
    const method = await fake.client.from("profiles").update({ signup_method: "google" }).eq("id", uid);
    expect(method.error).toMatchObject({ code: "42501" });
  });

  it("inserts a profile when the sign-up trigger did not create one", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "pat@t.test", password: "long enough pw", options: { data: { first_name: "Pat" } } });
    fake.db.profiles.length = 0;

    const profile = await saveOnboarding({}, "lower_back");
    expect(profile.focusArea).toBe("lower_back");
    expect(fake.profileWrites.map((write) => write.op)).toEqual(["update", "insert"]);
    expect(fake.profileWrites[1].keys).toContain("id");
    expect(fake.db.profiles).toHaveLength(1);
  });
});