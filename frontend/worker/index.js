// Static-asset Worker: all requests are served by the built SPA in ./dist.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
