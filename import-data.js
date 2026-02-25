// Devon's data from old habit tracker
const devonData = {
    goals: [
        {
            name: "🧘‍♂️ SPIRITUALITY & NERVOUS SYSTEM GOAL - Anxiety 80% Reduction",
            category: "spirituality",
            yearlyTarget: "80% anxiety reduction",
            habits: [
                {
                    name: "☀️ Morning Routine",
                    frequency: "daily",
                    notes: "1. Charts\n2. Prep Breakfast\n3. Jog (breath, prayer, gratitude)\n4. Breakfast (short vid)\n5. Pray for guidance"
                },
                {
                    name: "🌻 Afternoon Routine",
                    frequency: "daily",
                    notes: "1. 50 minutes Work (Next Logical Step)\n2. 5-7 Minute Break (full cognitive rest - walk, breath, water, pray, bible)\n3. Lunch + Dinner (learn + plan)\n* No planning (gPT), no learning outside what im working on at that moment"
                },
                {
                    name: "🌙 Night Routine",
                    frequency: "daily",
                    notes: "1. Calendar/Habits\n2. Journal (Reflect, Parts..)\n3. Breathwork (Shower)\n4. TV (Tea)\n5. Pray (listen to Christian audio)"
                }
            ],
            links: [
                { name: "Daily Routine", url: "https://notion.so" }
            ]
        },
        {
            name: "💰 FINANCIAL / WEALTH GOAL - $1M, 83K A MONTH (Jan 1/2027)",
            category: "financial",
            yearlyTarget: "$1M annual revenue",
            habits: [
                {
                    name: "Wyld - Power Hour (8-9am)",
                    frequency: "weekdays",
                    notes: "83k a month? How?"
                }
            ],
            links: [
                { name: "🦣 Wyld Plan", url: "https://notion.so" },
                { name: "LTV", url: "https://notion.so" },
                { name: "Profit", url: "https://notion.so" },
                { name: "AOV", url: "https://notion.so" },
                { name: "CAC Average", url: "https://notion.so" },
                { name: "CAC Meta", url: "https://notion.so" },
                { name: "100 Million Dollar Models Plan", url: "https://notion.so" },
                { name: "Scaling Percentage Data", url: "https://notion.so" }
            ]
        },
        {
            name: "🌿 Health & Fitness — 180 lbs @ ~12% Body Fat",
            category: "health",
            yearlyTarget: "180 lbs @ 12% body fat",
            habits: [
                {
                    name: "Nutrient Targets",
                    frequency: "daily",
                    notes: "Calories: 3,000 kcal / day\nProtein: 150 g / day"
                },
                {
                    name: "Exercise",
                    frequency: "custom",
                    customDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
                    notes: "6 times a week (Never miss 2 days in a row)"
                },
                {
                    name: "Salt (2tsps)",
                    frequency: "daily",
                    notes: ""
                },
                {
                    name: "3 liters of water (3 yetis)",
                    frequency: "daily",
                    notes: ""
                }
            ],
            links: [
                { name: "Workout Tracker", url: "https://notion.so" },
                { name: "Calorie Tracker", url: "https://notion.so" }
            ]
        },
        {
            name: "🤝 COMMUNITY & RELATIONSHIPS - Prepare myself for my wife",
            category: "community",
            yearlyTarget: "Build meaningful relationships",
            habits: [
                {
                    name: "Send a message that spreads love",
                    frequency: "daily",
                    notes: ""
                }
            ],
            links: [
                { name: "Plan to Meet my Wife", url: "https://notion.so" }
            ]
        },
        {
            name: "🫥 Personal Development",
            category: "personal",
            yearlyTarget: "Continuous growth",
            habits: [
                {
                    name: "Articulation plan (Vocabulary, Structure, Story Telling)",
                    frequency: "daily",
                    notes: "1. Seven words a week\n2. Top Books\n3. One Bible verse a week"
                },
                {
                    name: "Morning skincare",
                    frequency: "daily",
                    notes: ""
                },
                {
                    name: "Ozonated Anti-Aging Cream",
                    frequency: "daily",
                    notes: ""
                },
                {
                    name: "Whitten Teeth",
                    frequency: "daily",
                    notes: ""
                },
                {
                    name: "Hair Plan",
                    frequency: "daily",
                    notes: "1. Comb\n2. Micro needle or Molox (Hairline)"
                }
            ],
            links: [
                { name: "Skincare Plan", url: "https://notion.so" },
                { name: "Articulation", url: "https://notion.so" }
            ]
        }
    ],
    reminders: [
        { text: "Be so busy improving yourself that you have no time to criticize others.", author: "Bruce Lee" },
        { text: "Respond not react", author: "" },
        { text: "Worry about nothing. Pray about everything. Be content in all circumstances. And make progress toward a noble goal.", author: "Rick Warren" },
        { text: "How can I love God today? How can I love people today? How can I make a difference today?", author: "" },
        { text: "To Level Up. -Beliefs -Skills -Character", author: "" },
        { text: "Pray not for a lighter load, but instead for stronger shoulders", author: "" },
        { text: "8 hours of work to survive, 4 hours to thrive = 12 hours a day of work", author: "" }
    ]
};

// Function to import data
function importDevonData() {
    // Get current state
    let state = JSON.parse(localStorage.getItem('questTracker')) || {
        goals: [],
        reminders: []
    };
    
    // Add each goal
    devonData.goals.forEach(goalData => {
        const goal = {
            id: Date.now().toString() + Math.random(),
            name: goalData.name,
            category: goalData.category,
            yearlyTarget: goalData.yearlyTarget,
            habits: [],
            links: []
        };
        
        // Add habits
        if (goalData.habits) {
            goalData.habits.forEach(habitData => {
                const habit = {
                    id: Date.now().toString() + Math.random(),
                    name: habitData.name,
                    frequency: habitData.frequency || 'daily',
                    notes: habitData.notes || '',
                    customDays: habitData.customDays || [],
                    completed: false,
                    history: [],
                    stepsExpanded: false
                };
                goal.habits.push(habit);
            });
        }
        
        // Add links
        if (goalData.links) {
            goalData.links.forEach(linkData => {
                const link = {
                    id: Date.now().toString() + Math.random(),
                    name: linkData.name,
                    url: linkData.url
                };
                goal.links.push(link);
            });
        }
        
        state.goals.push(goal);
    });
    
    // Add reminders
    state.reminders = devonData.reminders;
    
    // Save to localStorage
    localStorage.setItem('questTracker', JSON.stringify(state));
    
    console.log('Data imported successfully!');
    console.log('Refresh the page to see your imported data.');
}

// Run the import
importDevonData();