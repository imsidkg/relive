import { Bot, HeartIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import TypingAnimatedText from "@/modules/home/ui/components/TypingText";
import { FlipWords } from "@/modules/home/ui/components/FlipText";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import { toast } from "sonner";
import ProjectForm from "@/modules/home/ui/components/ProjectForm";
const Page = () => {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);
  const transition = {
    duration: 0.8,
    delay: 0.5,
    ease: [0, 0.71, 0.2, 1.01],
  };
  const words = ["beautiful", "modern ", "apps", "websites", "with", "no code"];

  return (
    <>
      <AnimatePresence>
        <div className="flex flex-col max-w-5xl mx-auto w-full">
          <section className="space-y-6 py-[16vh] 2xl:py-48">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 3, delay: 0.5 }}
              className="flex  justify-center"
            >
              <Bot
                size={50}
                width={80}
                height={80}
                className="md:size-[80px] text-primary animate-bounce "
              />
            </motion.div>

            <TypingAnimatedText />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 1.5 }}
              className="text-lg md:text-xl text-muted-foreground text-center mb-2"
            >
              By chatting with AI Agent Create <br />{" "}
              <FlipWords words={words} />
            </motion.div>
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="max-w-3xl mx-auto w-full"
            >
              <ProjectForm />
            </motion.div>
          </section>
        </div>
      </AnimatePresence>
    </>
  );
};

export default Page;
