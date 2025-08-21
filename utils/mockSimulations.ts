type Study = {
    study_title: string;
    study_type: "focus-group";
    mode: "human-mod";
    topic: string;
    stimulus_media_url: string;
    discussion_questions: string;
    turn_based: boolean;
    num_turns: string;
  };

  const simulations: Study[] = [
    {
      study_title: "Electric Car Adoption",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Understanding consumer perceptions and barriers to adopting electric vehicles.",
      stimulus_media_url: "",
      discussion_questions: "1. What comes to mind when you think of electric cars?\n2. What are the biggest factors influencing your decision to buy or not buy an EV?\n3. How do you perceive the cost and maintenance of EVs compared to petrol cars?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "New Plant-Based Snack",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Evaluating consumer interest in a new plant-based, high-protein snack aimed at young adults.",
      stimulus_media_url: "",
      discussion_questions: "1. How often do you consume plant-based snacks?\n2. What qualities do you look for in a healthy snack?\n3. Would you consider switching from your usual snacks to this one? Why or why not?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Remote Work Tools",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Exploring employee experiences with remote work collaboration tools.",
      stimulus_media_url: "",
      discussion_questions: "1. What tools do you currently use for remote collaboration?\n2. What features are most important to you in such tools?\n3. Can you share any frustrations or gaps you've noticed?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Sustainable Fashion Awareness",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Understanding how much consumers value sustainability when buying fashion.",
      stimulus_media_url: "",
      discussion_questions: "1. Do you consider sustainability when shopping for clothes?\n2. What would motivate you to pay more for sustainable fashion?\n3. How do you usually learn about the ethical practices of brands?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Meal Kit Subscription Service",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Evaluating perceptions of convenience, price, and variety in meal kit subscriptions.",
      stimulus_media_url: "",
      discussion_questions: "1. Have you tried any meal kit services before?\n2. What factors would make you subscribe or cancel?\n3. What kinds of meals or cuisines do you wish were included?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Personal Finance App Usability",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Gathering feedback on features, trust, and usability of a personal budgeting app.",
      stimulus_media_url: "",
      discussion_questions: "1. What tools or apps do you use to manage your finances?\n2. What challenges do you face when budgeting monthly?\n3. What features would make a finance app more useful to you?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Travel Planning Preferences",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Exploring how travelers research, plan, and book their vacations.",
      stimulus_media_url: "",
      discussion_questions: "1. How do you usually plan your trips?\n2. What resources do you trust when researching destinations?\n3. What would make trip planning more enjoyable or easier?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Smart Home Devices",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Understanding perceptions of privacy, convenience, and trust with smart home technology.",
      stimulus_media_url: "",
      discussion_questions: "1. What smart home devices do you currently use, if any?\n2. What concerns do you have about smart devices in your home?\n3. How much do you trust these devices with your data?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Gen Z Social Media Trends",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Studying how Gen Z interacts with different social media platforms and content types.",
      stimulus_media_url: "",
      discussion_questions: "1. What social media platforms do you use daily?\n2. What type of content grabs your attention the most?\n3. How do you feel about ads and influencer content on these platforms?",
      turn_based: false,
      num_turns: "10"
    },
    {
      study_title: "Online Learning Experience",
      study_type: "focus-group",
      mode: "human-mod",
      topic: "Evaluating student satisfaction and motivation in online education environments.",
      stimulus_media_url: "",
      discussion_questions: "1. What’s your overall experience with online classes?\n2. What features help you stay engaged or focused?\n3. What improvements would you suggest for online learning platforms?",
      turn_based: false,
      num_turns: "10"
    }
  ];
  
  
  
  export function getRandomSimulation() {
    const index = Math.floor(Math.random() * simulations.length);
    return simulations[index];

  }
  

  