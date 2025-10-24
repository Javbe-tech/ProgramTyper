export const synergyCampaign = {
  characters: [
    { name: 'Dave Miller', avatar: '📊', color: '#3b82f6' },
    { name: 'VP of Sales', avatar: '👔', color: '#dc2626' },
    { name: 'System', avatar: '🎯', color: '#059669' }
  ],
  conversations: [
    {
      trigger: 'start',
      messages: [
        { character: 'Dave Miller', text: 'Hey, quick sync. We\'re green-lighting the "Dynamic Reporting" feature for the Q3 sprint. It should be a simple integration with the old Mercury module. Can you take point on this?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Sure thing, Dave. I\'ll scope it out and add the story points to the board. How hard can it be?', karma: 1 },
        { id: 'bad', text: 'The Mercury module? Didn\'t the last guy who touched that just start referring to himself in the third person? I\'ll look, but I\'m not making any promises.', karma: -1 }
      ]
    },
    {
      trigger: 'step2',
      messages: [
        { character: 'Dave Miller', text: 'Just checking in. The product team is asking for an ETA. Did you find the right API endpoint in the Mercury module yet?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'I found an endpoint that looks promising, but it returns a data object named "DEPRECATED_DO_NOT_USE". I\'m just going to use it and see what happens.', karma: 1 },
        { id: 'bad', text: 'The module doesn\'t have an API. It looks like it directly queries the database through a series of 4,000 uncommented lines of code. This is a complete rebuild, not an integration.', karma: -1 }
      ]
    },
    {
      trigger: 'step3',
      messages: [
        { character: 'Dave Miller', text: 'Uh oh. The QA team is saying that ever since you checked in your code, the user authentication system on the test server is randomly failing. They say it\'s your change.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'That\'s impossible, my code doesn\'t even touch authentication. Tell them to clear their cache.', karma: 1 },
        { id: 'bad', text: 'Of course it is. It looks like the Mercury module also handles session tokens for some reason. This is a critical-level dependency.', karma: -1 }
      ]
    },
    {
      trigger: 'step4',
      messages: [
        { character: 'Dave Miller', text: 'Bad news. Marketing just launched the "Coming Soon" campaign for the Dynamic Reporting feature. They used a mockup that has way more functionality than what we discussed. The launch date is in the press release. It\'s next Friday.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Well, sleep is a crutch anyway. I\'ll just hard-code the values to match the mockup for now. We can add it to the tech debt backlog.', karma: 1 },
        { id: 'bad', text: 'Then Marketing needs to issue a retraction. What they\'re promising is technically impossible with the current architecture.', karma: -1 }
      ]
    },
    {
      trigger: 'step5',
      messages: [
        { character: 'Dave Miller', text: 'I was digging through the old project files for the Mercury module and found a text file. It\'s from the original developer. It just says: "I am so sorry."', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It\'s fine. I\'ve almost got all the spaghetti code tied into a functioning knot. I thrive in chaos.', karma: 1 },
        { id: 'bad', text: 'We should have listened to the ghost of developers past. This whole project is cursed.', karma: -1 }
      ]
    },
    {
      trigger: 'step6',
      messages: [
        { character: 'Dave Miller', text: 'IT\'S ALL ON FIRE. THE STAGING SERVER IS DOWN. YOUR LATEST PUSH SEEMS TO HAVE TRIGGERED SOME KIND OF INFINITE LOOP THAT IS WRITING GIGABYTES OF ERROR LOGS EVERY SECOND.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Okay, panicking doesn\'t help. I\'m going to try a force-push directly to the main branch to overwrite the history.', karma: 1 },
        { id: 'bad', text: 'I\'m rolling back my changes. We need to tell the VP that the launch is a no-go. The system is too unstable.', karma: -1 }
      ]
    },
    {
      trigger: 'step7',
      messages: [
        { character: 'Dave Miller', text: 'The VP is here. He wants to know who is responsible for this. He said he either needs a finished feature by end-of-day, or a name. What do I tell him?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Tell him I can fix it. I\'m bypassing the test server. I\'m deploying this directly to production. It\'s our only shot.', karma: 1 },
        { id: 'bad', text: 'Tell him the project was doomed from the start due to a lack of investment in addressing legacy tech debt. This is a management failure.', karma: -1 }
      ]
    }
  ]
};

export const synergyResponses = {
  0: { // Step 1 responses
    'good': { character: 'Dave Miller', text: 'Great! That\'s the can-do attitude we love to see. Let\'s aim for a two-week turnaround.' },
    'bad': { character: 'Dave Miller', text: 'Let\'s maintain a positive mindset. The stakeholders are very excited about this. Just flag any potential blockers.' }
  },
  1: { // Step 2 responses
    'good': { character: 'Dave Miller', text: 'Okay, great. Keep pushing! We need to show some velocity in today\'s stand-up meeting.' },
    'bad': { character: 'Dave Miller', text: 'A rebuild isn\'t in scope for this sprint. We need to leverage our existing assets. Can you just... find a workaround?' }
  },
  2: { // Step 3 responses
    'good': { character: 'Dave Miller', text: 'They say they have. Can you just take a quick look? The VP of Sales is doing a demo for a huge client tomorrow.' },
    'bad': { character: 'Dave Miller', text: 'Okay, let\'s not get bogged down in the "why." What\'s the "how" for getting this fixed ASAP?' }
  },
  3: { // Step 4 responses
    'good': { character: 'Dave Miller', text: 'You\'re a lifesaver! Let\'s just get it across the finish line. We can circle back on the tech debt in a future sprint.' },
    'bad': { character: 'Dave Miller', text: 'That\'s not an option. The optics would be a disaster. We need to find a way to make this happen.' }
  },
  4: { // Step 5 responses
    'good': { character: 'Dave Miller', text: 'I\'m not sure what that means, but it sounds like you\'re making progress! Keep it up!' },
    'bad': { character: 'Dave Miller', text: 'Let\'s stay solution-oriented. We\'re a team. A very, very stressed-out team.' }
  },
  5: { // Step 6 responses
    'good': { character: 'Dave Miller', text: 'ARE YOU SURE?! The lead architect said to never, ever do that!' },
    'bad': { character: 'Dave Miller', text: 'I can\'t tell him that! You tell him that! He\'s on his way over to our desks right now!' }
  },
  6: { // Step 7 responses
    'good': { character: 'Dave Miller', text: 'He just nodded. He looks... strangely excited. Good luck. I\'m updating my resume.' },
    'bad': { character: 'Dave Miller', text: 'I told him. He just stared at me for a full minute and then said, "Fine. Write a full post-mortem report."' }
  }
};
