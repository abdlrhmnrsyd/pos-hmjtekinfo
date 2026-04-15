"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-xl border-border bg-foreground/[0.02] hover:bg-foreground/[0.06] transition-all"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground/70" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground/70" />
            <span className="sr-only">Ganti Tema</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover text-foreground p-1 shadow-xl min-w-[120px]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer px-3 py-2 text-sm">
          Terang
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer px-3 py-2 text-sm">
          Gelap
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer px-3 py-2 text-sm">
          Sistem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
