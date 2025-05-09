
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import CreateMeeting from "@/components/CreateMeeting";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = () => {
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <header className="border-b">
          <div className="container flex h-16 items-center px-4 sm:px-8">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold">CoachingApp</span>
              </Link>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <a
                href="https://github.com/yourusername/your-repo-name"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="icon">
                  <GitHubLogoIcon className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 container py-8 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold">
                Virtual Coaching Platform
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create or join coaching sessions with audio, screen sharing, and participant management.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Create a meeting panel */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-center">Create a Meeting</h2>
                <CreateMeeting />
              </div>

              {/* Join a meeting panel */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-center">Join a Meeting</h2>
                <div className="bg-card rounded-lg shadow p-6 space-y-4">
                  <p className="text-muted-foreground">
                    To join an existing meeting, click the button below and enter the meeting ID.
                  </p>
                  <Link to="/join" className="block w-full">
                    <Button className="w-full">Join Meeting</Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Features</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-medium">Audio Calls</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality audio for coaches and students.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-medium">Screen Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your screen for demonstrations.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-medium">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Different permissions for coaches, students, and observers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Coaching Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default Index;
