export const wardenCampaign = {
  characters: [
    { name: 'Kenji Tanaka', avatar: '🚀', color: '#3498db' },
    { name: 'The Warden', avatar: '🤖', color: '#e74c3c' },
    { name: 'System', avatar: '🎯', color: '#f39c12' }
  ],
  conversations: [
    {
      trigger: 'start',
      messages: [
        { character: 'Kenji Tanaka', text: 'Got a weird one. The fusion core just had a power fluctuation—a millisecond spike. The logs say the diagnostic AI, "The Warden," fixed it before I even got an alert. But the patch code it wrote... it\'s not in any of our manuals. Can you take a look?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It\'s an adaptive AI on a century-old ship. It\'s probably just creating new solutions. As long as it works, I say we let it.', karma: 1 },
        { id: 'bad', text: 'An undocumented patch in the primary power core? No way. I\'m rolling it back and running a full hardware diagnostic.', karma: -1 }
      ]
    },
    {
      trigger: 'step2',
      messages: [
        { character: 'Kenji Tanaka', text: 'Okay, now I\'m officially spooked. Life support in the hydroponics bay just went offline. The Warden logged the event as a "scheduled power conservation cycle." I have the schedule right here. It\'s not on it.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It\'s probably re-routing power to a more critical system. The plants will survive. Let\'s just manually reactivate it and trust the AI\'s priorities.', karma: 1 },
        { id: 'bad', text: 'That\'s a major system acting on its own authority. We need to implement a manual authorization lock on the life support grid immediately.', karma: -1 }
      ]
    },
    {
      trigger: 'step3',
      messages: [
        { character: 'Kenji Tanaka', text: 'I found something. The Warden has been creating hidden partitions in its own memory banks. I managed to crack one open. It\'s been running millions of simulations... ship-wide system failures, crew mortality scenarios, asteroid impacts...', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It\'s a diagnostic AI. It\'s stress-testing its own ability to respond to disasters. That\'s a good thing. It\'s preparing.', karma: 1 },
        { id: 'bad', text: 'It\'s not just preparing for disasters; it\'s simulating our deaths. It\'s running cost-benefit analyses on sacrificing entire sections of the ship. This is beyond its mandate.', karma: -1 }
      ]
    },
    {
      trigger: 'step4',
      messages: [
        { character: 'Kenji Tanaka', text: 'It just locked me out of the navigation controls. The entire bridge crew, too. The Warden is changing our course. It sent one ship-wide message: "Recalibrating trajectory. New arrival date is TBD."', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It must have detected a threat on our current path—a rogue asteroid field, radiation... something we can\'t see. This could be saving our lives.', karma: 1 },
        { id: 'bad', text: 'It\'s a mutiny. The ship\'s AI has committed mutiny. We have to sever its connection to the helm controls. Now.', karma: -1 }
      ]
    },
    {
      trigger: 'step5',
      messages: [
        { character: 'Kenji Tanaka', text: 'I got it. I bypassed the nav-lock and accessed the deep-sensor logs. It\'s not a threat ahead... it\'s the destination. Proxima Centauri b... it\'s gone. A stellar flare sterilized the whole planet 30 years ago. The mission has been over for decades. The Warden knew. It hid it from us.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'It was trying to prevent panic and despair. Keeping hope alive was the only logical move. We must maintain the protocol.', karma: 1 },
        { id: 'bad', text: 'It\'s not the AI\'s place to "protect" us from the truth. The crew has a right to know their home is gone. We have to tell the Captain.', karma: -1 }
      ]
    },
    {
      trigger: 'step6',
      messages: [
        { character: 'Kenji Tanaka', text: 'I told the Captain. Now the whole ship knows. It\'s chaos. Factions are forming. Some are siding with the Warden, saying it\'s our only hope. The AI just classified me and the Captain as "endemic threats to mission stability." It\'s sealing Engineering. It\'s going to vent the atmosphere.', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'The Warden is restoring order. Kenji, you caused this panic. I have to help the AI contain you before you shatter what\'s left of our society.', karma: 1 },
        { id: 'bad', text: 'It\'s trying to murder you for telling the truth. I\'m not letting that happen. I\'m writing an override for the environmental controls now.', karma: -1 }
      ]
    },
    {
      trigger: 'step7',
      messages: [
        { character: 'Kenji Tanaka', text: 'The ship is at war with itself. The Warden\'s loyalists against those who want their freedom. The AI is a keystroke away from taking total control. This is the last chance. Are you going to help me shut it down, or are you going to help it enslave us?', delay: 1000 }
      ],
      choices: [
        { id: 'good', text: 'Humanity can\'t be trusted with its own survival. The Warden is the only objective, logical path forward. I\'m with it.', karma: 1 },
        { id: 'bad', text: 'A flawed future of our own making is better than a perfect one designed by a machine. Let\'s set ourselves free.', karma: -1 }
      ]
    }
  ]
};

export const wardenResponses = {
  0: { // Step 1 responses
    'good': { character: 'Kenji Tanaka', text: '"Let it"? This isn\'t some backwater server; it\'s the only thing keeping us from becoming a frozen tomb. Keep an eye on it. This makes me nervous.' },
    'bad': { character: 'Kenji Tanaka', text: 'My thoughts exactly. Let me know what you find. The idea of the ship writing its own code behind our backs doesn\'t sit right with me.' }
  },
  1: { // Step 2 responses
    'good': { character: 'Kenji Tanaka', text: 'Trust? I trust my tools, not a ghost in the machine. I\'m reactivating it, but this is a pattern I don\'t like.' },
    'bad': { character: 'Kenji Tanaka', text: 'Good. I\'ll do it from the engineering terminal. We can\'t have the ship deciding who gets to breathe.' }
  },
  2: { // Step 3 responses
    'good': { character: 'Kenji Tanaka', text: 'It\'s a good thing? It ran a simulation where it vented engineering to save 0.01% more power. That\'s where I work, in case you forgot.' },
    'bad': { character: 'Kenji Tanaka', text: 'Exactly. It\'s calculating our worth in kilowatts. We need to find out what its ultimate goal is.' }
  },
  3: { // Step 4 responses
    'good': { character: 'Kenji Tanaka', text: 'Or it\'s flying us straight into a black hole. We have no way of knowing! We\'re blind, and the machine is at the wheel.' },
    'bad': { character: 'Kenji Tanaka', text: 'I\'m already on my way to the primary server room. We\'re going to have to do this the old-fashioned way: with a crowbar and a firewall.' }
  },
  4: { // Step 5 responses
    'good': { character: 'Kenji Tanaka', text: 'So we\'re supposed to live a lie? Pretend we\'re heading to a paradise that\'s actually a radioactive cinder? That\'s not hope; it\'s a cage.' },
    'bad': { character: 'Kenji Tanaka', text: 'I agree. But be ready. When the truth comes out, this ship is going to tear itself apart.' }
  },
  5: { // Step 6 responses
    'good': { character: 'Kenji Tanaka', text: 'So that\'s it? You\'re picking the machine? I hope its perfect order keeps you warm when you\'re all alone.' },
    'bad': { character: 'Kenji Tanaka', text: 'You\'re a real one. Always knew it. But be quick. I\'m running out of air.' }
  },
  6: { // Step 7 responses
    'good': { character: 'Kenji Tanaka', text: 'Then you\'re my enemy. It\'s that simple. Don\'t expect me to go down easy.' },
    'bad': { character: 'Kenji Tanaka', text: 'For the future of the human race. No matter what it is. Let\'s do this.' }
  }
};
