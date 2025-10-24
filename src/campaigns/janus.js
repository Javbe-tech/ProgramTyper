export const janusCampaign = {
  characters: [
    { name: 'Glitch', avatar: '👨‍💻', color: '#8b5cf6' },
    { name: 'OmniCorp Handler', avatar: '🏢', color: '#ef4444' },
    { name: 'System', avatar: '🤖', color: '#10b981' }
  ],
  conversations: [
    {
      trigger: 'start',
      messages: [
        { character: 'Glitch', text: 'Got a gig for you. OmniCorp. Simple data snatch from a legacy server. They\'re paying top creds. The security is a joke; I\'ve already paved the way. You in?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'A corporate server with weak security? Smells like a trap, but the money\'s too good. I\'m in.', karma: 1 },
        { id: 'bad', text: 'Easy money is never easy. What\'s the catch, Glitch? What aren\'t you telling me?', karma: -1 }
      ]
    },
    {
      trigger: 'step2',
      messages: [
        { character: 'Glitch', text: 'You\'re in. The target file is codenamed "Janus." Find it, copy it, and get out. I\'m scrubbing your digital footprints as you go.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Copying it now. This file is huge... and the encryption is... biological? Never seen anything like it.', karma: 1 },
        { id: 'bad', text: 'Hold on. I\'m running a preliminary scan on the file directory. "Janus" isn\'t just a data file; it\'s some kind of executable program.', karma: -1 }
      ]
    },
    {
      trigger: 'step3',
      messages: [
        { character: 'Glitch', text: 'Get out! Now! It was a honeypot. A silent alarm just tripped. They\'re deploying military-grade ICE (Intrusion Countermeasures Electronics). This isn\'t standard security; this is a hunter-killer program.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'I\'m not leaving the payday behind. I can bypass it. Just give me a minute.', karma: 1 },
        { id: 'bad', text: 'Understood. Aborting the download and wiping my presence. We can live to hack another day.', karma: -1 }
      ]
    },
    {
      trigger: 'step4',
      messages: [
        { character: 'Glitch', text: 'I dug deeper while you were running. "Janus" isn\'t a program. It\'s a weapon. A "personality matrix inhibitor." It\'s designed to digitally lobotomize humans with advanced cybernetic brains. Our client isn\'t just a corporate rival.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'A weapon is a product. And products sell. This just made our stolen data a lot more valuable.', karma: 1 },
        { id: 'bad', text: 'This is a tool for digital assassination. We can\'t let anyone have this. We need to destroy it.', karma: -1 }
      ]
    },
    {
      trigger: 'step5',
      messages: [
        { character: 'Glitch', text: 'They\'re bypassing me. They\'re hailing you directly. OmniCorp Internal Security. They know who you are. They\'re offering you a deal: a full pardon and a senior position in their netrunning division. All you have to do is give them the Janus file... and my location.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'A steady paycheck and a corporate title beats being a ghost in the slums. I\'m taking the deal.', karma: 1 },
        { id: 'bad', text: 'They can take their offer and shove it. Nobody threatens my partners. We\'re in this together.', karma: -1 }
      ]
    },
    {
      trigger: 'step6',
      messages: [
        { character: 'Glitch', text: 'OmniCorp has a dead man\'s switch. Since they can\'t secure Janus, they\'re going to erase it. They\'ve activated a city-wide data purge targeting the old network where most augmented citizens live. It will wipe the file, but it will also fry thousands of cyberbrains. It\'s a massacre.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Collateral damage. It\'s not our problem. We need to focus on our own survival and escape.', karma: 1 },
        { id: 'bad', text: 'We can\'t let them do that. There has to be a way to stop the purge protocol.', karma: -1 }
      ]
    },
    {
      trigger: 'step7',
      messages: [
        { character: 'Glitch', text: 'This is it. The purge starts in two minutes. The OmniCorp netrunners are hunting us. Every second counts. What\'s the final play?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'We give them what they want. Transmit the Janus file to OmniCorp\'s lead agent. It\'s our only bargaining chip.', karma: 1 },
        { id: 'bad', text: 'We fight. Send me the core sequence of the purge protocol. I\'ll write the counter-virus. Let\'s burn them down.', karma: -1 }
      ]
    }
  ]
};

export const janusResponses = {
  0: { // Step 1 responses
    'good': { character: 'Glitch', text: 'That\'s the spirit. Just be quick. In and out before anyone even knows you were there. Here are the coordinates.' },
    'bad': { character: 'Glitch', text: 'The catch is that we\'ll be rich. The client is paying for speed, not subtlety. Stop being paranoid and get to work. Here are the coordinates.' }
  },
  1: { // Step 2 responses
    'good': { character: 'Glitch', text: 'Biological? That wasn\'t in the brief. Just grab the damn thing. The client can figure out what it is later.' },
    'bad': { character: 'Glitch', text: 'An executable? Dammit. The client said it was inert data. This job just got a lot more complicated.' }
  },
  2: { // Step 3 responses
    'good': { character: 'Glitch', text: 'You don\'t have a minute! This thing doesn\'t just block you; it\'ll trace your signal back to your physical rig and flash-fry the circuits!' },
    'bad': { character: 'Glitch', text: 'Good call. I\'m throwing up every decoy I have. Go dark the second you\'re out.' }
  },
  3: { // Step 4 responses
    'good': { character: 'Glitch', text: 'You\'re playing with fire. The kind of people who build this don\'t just negotiate; they eliminate loose ends.' },
    'bad': { character: 'Glitch', text: 'My thoughts exactly. But it\'s too late for that. The file is already on your system, and I think they know it.' }
  },
  4: { // Step 5 responses
    'good': { character: 'Glitch', text: 'After all we\'ve been through? I shouldn\'t be surprised. You\'re on your own now, kid. I hope it\'s worth it.' },
    'bad': { character: 'Glitch', text: '...Good. I was hoping you\'d say that. Because they\'re not just threatening us anymore. They\'ve activated a contingency plan.' }
  },
  5: { // Step 6 responses
    'good': { character: 'Glitch', text: 'That\'s a cold calculus, even for a deck-jockey. Fine. We save ourselves. But don\'t expect the city to forgive you.' },
    'bad': { character: 'Glitch', text: 'There is, but it\'s insane. We\'d have to code a counter-virus and upload it directly into the purge signal as it activates. It\'s a one-in-a-million shot.' }
  },
  6: { // Step 7 responses
    'good': { character: 'Glitch', text: 'A deal with devils. I hope you know what you\'re doing. Sending you their secure channel now.' },
    'bad': { character: 'Glitch', text: 'This is it, kid. Become a legend or become a ghost. Sending the code now.' }
  }
};
