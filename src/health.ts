export function healthRoute() {
  return new Response(
    JSON.stringify({ status: "ok", service: "ross-tax-prep-api" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
