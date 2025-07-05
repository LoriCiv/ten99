import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // This makes the landing page accessible to everyone
  publicRoutes: ["/"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
