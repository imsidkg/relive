'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/trpc';
import { Bot, ChevronDownIcon, ChevronLeftIcon, Laptop2, MoonIcon, SunIcon, SunMediumIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface Props {
  projectId: string;
}

const ProjectHeader = ({ projectId }: Props) => {
  const { data: project, isLoading } = trpc.getProjectById.useQuery({ id: projectId });
  const [theme, setTheme] = useState('system'); 

  if (isLoading) {
    return (
      <header className="p-2 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <Bot size={18} width={18} height={18} className="hidden md:block text-primary" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </header>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <header className="p-2 flex justify-between items-center border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Button
              variant="ghost"
              size="sm"
              className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!"
            >
              <Bot size={18} width={18} height={18} className="hidden md:block text-primary" />
            </Button>
            <span className="text-sm font-medium">{project.name}</span>
            <ChevronDownIcon />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem asChild>
            <Link to="/" className="flex items-center gap-2">
              <ChevronLeftIcon />
              <span>Go to dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMediumIcon className="size-4 text-muted-foreground" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <SunIcon className="mr-2" />
                    <span>Light</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon className="mr-2" />
                    <span>Dark</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Laptop2 className="mr-2" />
                    <span>System</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default ProjectHeader;