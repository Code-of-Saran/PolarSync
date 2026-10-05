// Smoke test: every main route and key API endpoint should respond 200.
// Usage: npm run dev:all  (in another terminal)  then  npm run check:routes
const routes = [
  '/', '/explore', '/explore/map', '/explore/location/loc-maitri', '/search?q=antarctic%20ice', '/repository', '/repository/d-seaice',
  '/media', '/media/m-penguins', '/media/expeditions/exp-antarctic-2026', '/education', '/education/stories/story-antarctica',
  '/education/tour/tour-maitri', '/education/quiz/quiz-polar', '/education/kits', '/analytics', '/contribute', '/dashboard',
  '/admin', '/admin/review', '/login', '/settings', '/about',
  '/api/health', '/api/repository', '/api/search?q=antarctic%20ice', '/api/locations', '/api/media', '/api/analytics', '/api/ai/status',
];

async function check() {
  console.log('Testing PolarSync routes against http://localhost:3000 ...');
  let failed = 0;
  for (const route of routes) {
    try {
      const res = await fetch('http://localhost:3000' + route);
      console.log(`[${res.status}] ${route}`);
      if (res.status !== 200) failed++;
    } catch (e) {
      failed++;
      console.error(`[FAIL] ${route}: ${e.message}`);
    }
  }
  console.log(failed ? `\n${failed} route(s) failed.` : '\nAll routes responded with HTTP 200.');
  process.exit(failed ? 1 : 0);
}

check();
