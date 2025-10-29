<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  gameState: { type: Object, required: true }
});

const emit = defineEmits(['close', 'purchased']);

const properties = [
  {
    key: 'parentsBasement',
    name: "123 Main Street (Hot Property Alert)",
    image: '/home1.png',
    cost: 15000,
    wattage: 300,
    blurb: 'A fixer-upper bursting with "character" and questionable odors. As-is; bring tools and optimism.',
    details: `🔥 Hot Property Alert! 🔥 Your Dream "Opportunity" Awaits!
Address: 123 Main Street, Anytown, USA
Price: $15,000 (Because we believe in transparency, even when it hurts a little)
Bedrooms: 2 (Potentially 3, if you're good with a hammer and have no regard for building codes)
Bathrooms: 1 (Mostly functional, but bring your own plunger)
Square Footage: Approx. 950 sq ft (Rough estimate, surveying equipment not included)

Tired of those bland, move-in-ready houses? Do you crave a project that will truly test your patience, carpentry skills, and possibly your marriage? Then look no further! We proudly present 123 Main Street, a property so full of "character" it practically oozes personality (and maybe a little something else from the leaky pipes).

What You'll Love (If you're a masochist or a visionary):
Original Features! We're talking truly original. Many elements haven't been updated since... well, we're not entirely sure, but "vintage" is an understatement. Think retro avocado appliances (non-functional, for decorative purposes only), shag carpeting that tells a thousand stories, and wallpaper that will transport you back to a forgotten era.
A "Spacious" Yard: Perfect for creative landscaping projects, like clearing out the jungle that currently resides there.
Prime Location: Nestled in an established neighborhood, this home is conveniently located near... other established homes that are in significantly better condition.
Endless Potential: Seriously, the possibilities are only limited by your budget, imagination, and tolerance for lead paint.
Guaranteed Conversation Starter: Your friends and family will definitely have opinions about your new abode.

What You Should Know (Because honesty is the best policy, even if it makes us cry):
"As-Is" Sale: We mean it. We're not fixing anything. If it's broken, it's yours to break more.
Cosmetic... and Structural Issues: Let's just say this house offers a full spectrum of renovation challenges. Bring your contractor, your exorcist, and a strong sense of humor.
Odoriferous Ambience: The house comes with its own unique aroma, developed over decades. We're confident a few industrial-strength air fresheners (and maybe a hazmat suit) will sort it out.
Pet-Friendly (Previous Owners Were Very Friendly With Many Pets): Evidence may or may not be present.
Cash Buyers Preferred: Loan officers tend to faint when they see the appraisal.

Don't miss this once-in-a-lifetime opportunity to own a piece of history that desperately needs a future! Whether you're an experienced flipper, a brave DIY enthusiast, or just someone who enjoys a challenge, 123 Main Street is calling your name (or maybe that's just the wind whistling through the broken window panes).
Schedule your showing today! (Wear sturdy shoes and bring a flashlight!)`
  },
  {
    key: 'studioApartment',
    name: 'Apt 7B, Urban Solitude Tower',
    image: '/home2.png',
    cost: 100000,
    wattage: 900,
    blurb: 'Your personal freedom pod. Minimalist efficiency and maximum solitude in the city core.',
    details: `🏢 Your Personal Freedom Pod Awaits! (With a Bathroom!) 🏢
Address: Apt 7B, Urban Solitude Tower, Bustleburg, USA
Price: $100,000 (Because not having to share your fridge with anyone is priceless, but also has a price tag)
Bedrooms: 0 (Unless you count the corner where your bed lives)
Bathrooms: 1 (Gloriously private, no tiny humans will ever barge in)
Square Footage: Approx. 350 sq ft (Big enough for you, your dreams, and maybe a very small pet that doesn't judge)

Tired of sprawling houses filled with "responsibilities"? Do you dream of a living space where your entire existence can be managed from a single, comfortable chair? Look no further! Apt 7B is not just an apartment; it's a testament to optimized living, where every square inch serves your purpose (and maybe a few tiny pieces of furniture).

What You'll Absolutely Adore:
Ultimate Efficiency: Your bed, kitchen, and living room are all in the same room! No wasted steps, no long commutes from the bedroom to the coffee maker. It's practically genius.
Minimalist Lifestyle (Forced or Otherwise): This apartment practically begs you to declutter. Say goodbye to excessive consumerism and hello to only the essentials (and your laptop, obviously).
Location, Location, Location: Situated in the heart of Bustleburg, you're steps away from... everything that isn't your apartment. Bars, restaurants, cafes – your real living room is the city itself!
Low Maintenance: Seriously, how much cleaning can 350 sq ft really require? A quick sweep, a wipe-down, and you're done. More time for existential pondering!
Privacy Guaranteed: No roommates, no kids, no spouse. Just you and your thoughts (and the occasional muffled sounds from your neighbors, which you can easily drown out with headphones).
Perfect for the Introvert, the Hustler, or the Post-Apocalyptic Survivor: Adaptable to any lifestyle that values self-reliance and proximity to takeout.

What You Should Know (Just a heads-up, not a warning):
Intimate Gatherings Only: Your "dinner parties" will likely consist of you and your Uber Eats delivery person.
Master of Organization Required: If you're a hoarder, this might be a therapeutic challenge (or your worst nightmare).
Shared Laundry: Because even in your kingdom of solitude, some things must be communal.
Elevator Etiquette: Learn it. Live it. It's your only journey into the outside world (besides walking).
"Cozy" is an Understatement: You'll learn to love the snug embrace of your personal space.

Ready to embrace the unburdened life? Discover the liberating power of a studio apartment where your only commitment is to yourself!`
  },
  {
    key: 'suburbanHouse',
    name: '456 Suburban Dream Lane',
    image: '/home3.png',
    cost: 750000,
    wattage: 2500,
    blurb: 'Open-concept conformity with HOA-approved lawn and mandatory bake sales.',
    details: `🏡 Be Warned: Extreme Conformity Ahead! Your Future Prison (A.K.A. "Family Home") Awaits! 🏡
Address: 456 Suburban Dream Lane, Perfectville, USA
Price: $450,000 (Because lifelong indentured servitude isn't cheap, folks!)
Bedrooms: 4 (Plenty of room for mini-mes, their mountains of toys, and the fleeting hope of alone time)
Bathrooms: 2.5 (One for show, one for actual use, and a half-bath for emergency hiding)
Square Footage: Approx. 2,800 sq ft (Enough space to feel like you're constantly cleaning, but never quite catching up)

Are you ready to trade your freedom for lawn maintenance and mandatory HOA meetings? Does the thought of sacrificing your evenings to school plays and soccer practice fill you with... something? Then congratulations, you've found your match! 456 Suburban Dream Lane is the pinnacle of what society tells you "happiness" looks like.

What You'll (Reluctantly) Appreciate:
Open-Concept Living: So you can always hear what everyone else is doing. Privacy is overrated anyway, right?
Gourmet Kitchen: Perfect for cooking those elaborate family meals that will inevitably be rejected by at least one picky eater. Stainless steel appliances included, because nothing says "I've given up on my dreams" like matching kitchenware.
Manicured Lawn: Just imagine the joy of spending your weekends perfectly manicuring this green rectangle, instead of, you know, doing anything you actually want to do.
"Family-Friendly" Neighborhood: Translation: lots of other people who made the same life choices, ensuring a steady stream of playdates, bake sales, and unsolicited parenting advice.
Excellent School District: Because the only thing better than raising your own kids is paying exorbitant taxes to educate everyone else's too!
Two-Car Garage: Ideal for storing all the stuff you accumulate when you have kids, leaving just enough room for one actual car (if you're lucky).

What You Should Brace Yourself For:
The Unavoidable Future: This house practically screams "settle down and never leave." It's a commitment, not just to a mortgage, but to a lifestyle.
The Echo of Laughter (and Screaming): The walls are thin, your patience will be thinner.
The Neighbors: They're nice. Too nice. They'll probably want to borrow your power tools and invite you to potlucks.
The Relentless March of Time: Every crayon mark, every dent in the wall, every faded photograph will serve as a constant reminder of the life you've built... and the bachelor pad you once had.

If you're ready to embrace the glorious monotony of suburban family life, then this is the place for you! Come see 456 Suburban Dream Lane – where your independent spirit goes to politely die.`
  },
  {
    key: 'downtownLoft',
    name: 'Penthouse Loft, The Zenith',
    image: '/home4.png',
    cost: 5000000,
    wattage: 7000,
    blurb: 'Industrial-chic excess with panoramic views and curated existential dread.',
    details: `💰 Warning: May Cause Excessive Envy & Existential Dread in Less Fortunate Acquaintances 💰
Address: Penthouse Loft, The Zenith, Downtown Metropolis, USA
Price: $5,000,000 (A steal, if you consider the priceless bragging rights and the ability to look down on everyone else)
Bedrooms: 2 (One for sleeping, one for your ever-expanding collection of artisanal coffee machines)
Bathrooms: 2.5 (Because waiting for a toilet is for commoners)
Square Footage: Approx. 3,500 sq ft (Enough space to walk around wondering why you're still not truly happy)

Are you tired of associating with the unwashed masses? Does your current living situation lack that crucial "I'm better than you" vibe? Have you always wanted to spend more on rent than most people make in a decade? Then prepare to have your wildest, most materialistic dreams realized! The Penthouse Loft at The Zenith isn't just an apartment; it's a statement. A very loud, very expensive statement.

What You'll Be Obligated to Appreciate:
Soaring Ceilings & Exposed Brick: Because nothing says "authentic urban experience" like carefully preserved industrial-chic aesthetics that cost more than a small country's GDP to install.
Panoramic City Views: Perfect for surveying your kingdom, judging the traffic below, and contemplating your next extravagant purchase. Also great for those Instagram stories where you "casually" show off your view.
Chef's Kitchen (Because You'll Never Actually Cook): Equipped with state-of-the-art appliances you'll probably only use to reheat takeout from that Michelin-starred restaurant downstairs.
Concierge Service: They'll fetch your dry cleaning, sign for your obscure online orders, and politely pretend not to judge your life choices.
Fitness Center & Rooftop Pool: So you can work out and swim without having to rub shoulders with the general public. Because germs, darling.
Prime Downtown Location: You're literally in the thick of it – the noise, the crowds, the endless opportunities to spend even more money.

What You Should Already Know (Because if you're buying this, you already know everything):
The Price Tag is Just the Beginning: Factor in absurd HOA fees, property taxes, and the cost of maintaining your lavish lifestyle. It's a never-ending financial commitment!
The Neighbors: A mix of trust-fund babies, crypto bros, and a few old money types who probably bought their loft when it was actually affordable. They'll mostly ignore you, which is ideal.
Authenticity is an Illusion: While it looks gritty and urban, it's meticulously curated to appear that way. Don't worry, your organic, cold-pressed juice delivery will still reach you on time.
The Unavoidable Existential Crisis: After acquiring everything, you might find yourself asking, "Is this all there is?" (The answer is yes, if you only measure happiness in square footage and thread count).
Parking is an Adventure: Even with valet, navigating downtown is a special kind of hell. But hey, that's what your personal driver is for, right?

If you're ready to achieve peak materialism and enjoy the fleeting satisfaction of conspicuous consumption, then welcome home!`
  },
  {
    key: 'techMansion',
    name: 'The "Alpha Nerd" Estate',
    image: '/home5.png',
    cost: 40000000,
    wattage: 18000,
    blurb: 'Zero-gravity meditation meets quantum labs in a dystopian wellness palace.',
    details: `🚀 Prepare for Launch! Your Space-Aged Silicon Sanctuary Awaits! (No Peasants Allowed) 🚀
Address: The "Alpha Nerd" Estate, Hyperloop Hills, Innovator's Valley, CA
Price: $40,000,000 (Because disrupting industries and having 12-foot ceilings ain't cheap)
Bedrooms: 8 (Plus 4 "Incubator Pods" for your start-up bros)
Bathrooms: 12 (One for every mood, and then some for pure excess)
Square Footage: Approx. 25,000 sq ft (So vast, you'll need a golf cart to get from the "think tank" to the "bio-hacking lab")

Have you successfully leveraged blockchain, AI, or some other buzzword-compliant tech to amass a fortune beyond human comprehension? Do you yearn for a home that screams, "I invented the future, and also, I'm slightly socially awkward"? Behold, The "Alpha Nerd" Estate! This isn't just a house; it's a monument to unfathomable wealth and questionable taste, meticulously designed to validate your unparalleled success.

What Your Inner Tech-Bro Will Salivate Over:
Fully AI-Integrated Smart Home (That Secretly Judges You): Every light, every temperature, every toilet flush is optimized by an advanced AI that probably knows your search history better than you do. It's not spying, it's anticipating your needs.
"Disruptive" Architecture: A seamless blend of brutalist concrete, expansive glass, and sustainable (read: obscenely expensive) materials, ensuring it looks both imposing and vaguely dystopian.
Zero-Gravity Meditation Chamber: Because even multi-millionaires need to find their inner peace, ideally while floating in a sound-proof pod that cost more than a traditional house.
Quantum Computing Lab (for "Personal Projects"): Perfect for dabbling in theoretical physics, mining obscure cryptocurrencies, or just showing off to your equally rich friends.
Indoor/Outdoor Augmented Reality "Holodeck": Why go outside when you can simulate the Amazon rainforest, the surface of Mars, or even a normal conversation with non-tech people, all from the comfort of your living room?
Autonomous Vehicle Charging Station (Naturally): With a dedicated drone landing pad for your Amazon Prime same-minute deliveries.
Olympic-Sized Infinity Pool (with underwater Sonos): Because splashing around in regular water is for normies.
Bio-Hacking & Wellness Wing: Complete with a cryotherapy chamber, hyperbaric oxygen therapy, and a personal genome sequencing lab. You're not just living; you're optimizing your existence.
24/7 On-Site IT Support & Security Detail: For when the Wi-Fi glitches, or when the outside world tries to remind you it exists.

What You'll Need to Justify (But Won't):
The Cost of "Innovation": Every gadget, every sensor, every artisanally sourced piece of reclaimed wood contributes to a price tag that will make your accountant weep.
The Echoing Emptiness: Despite 25,000 sq ft, you'll often find yourself alone, perhaps debating the merits of sentient toasters with your AI.
The Pressure to Perform: With all this tech, you'd better be curing cancer or launching a new social media platform, not just binge-watching sci-fi docs.
The Inevitable Obsolescence: That $500,000 gadget you bought last year? It's already outdated. Embrace the never-ending upgrade cycle.
The Sheer Inability to Relate to Anyone Not Worth Nine Figures: Your dinner party conversations will solely revolve around IPOs, venture capital, and the latest iteration of your personal assistant bot.

If your net worth has more zeros than your social calendar has actual dates, then this is your forever home! Step into the future (and a hefty mortgage) today!`
  },
  {
    key: 'corporateOffice',
    name: 'The "Soul Crusher" Tower',
    image: '/home6.png',
    cost: 300000000,
    wattage: 50000,
    blurb: 'Open-plan misery optimized for shareholder value and helicopter access.',
    details: `🏛️ The "Soul Crusher" Tower: Where Dreams Go to Die (Profitably!) 🏛️
Address: The Apex of Avarice, 100 Corporate Overlord Plaza, Megalopolis, USA
Price: $300,000,000 (A paltry sum for absolute market dominance and an unparalleled view of your competitors' demise)
Floors: 80 (Enough vertical real estate to ensure you never have to look your employees in the eye)
Total Square Footage: 1,200,000 sq ft (Roughly the size of a small country, but with significantly less joy)
Employee Capacity: Up to 10,000 (Or 5,000 if you're promoting "open-plan misery")

Has your company achieved a level of unchecked power that demands a physical manifestation of its hubris? Do you yearn for an office space where innovation is stifled, creativity is optional, and the coffee is always just "okay"? Welcome to The "Soul Crusher" Tower! This isn't just a corporate office; it's a gilded cage for your workforce, meticulously designed to extract maximum shareholder value while minimally acknowledging human dignity.

What Your Board (and your Ego) Will Love:
Imposing, Monolithic Architecture: A testament to your company's unyielding dominance, designed to make every competitor's building look like a shack. Because intimidation is a valid business strategy.
"Synergy-Optimized" Open-Plan Layouts: Rows upon rows of identical desks, ensuring maximum distraction, minimal privacy, and a constant low hum of despair. Collaboration is mandatory, personal space is a myth.
"Innovation Hubs" (aka, brightly colored rooms with beanbag chairs): Where employees are encouraged to "think outside the box" for precisely 30 minutes before returning to their cubicles to meet impossible deadlines.
Executive Sky Lounge & Private Helipad: Because plebians take elevators. Your ascent to the top should be as swift and isolated as possible.
Propaganda Art Installations: Giant, abstract sculptures that vaguely symbolize "growth" and "teamwork," strategically placed to distract from the 60-hour work weeks.
"Wellness Pods" (aka, glorified napping booths): For when your employees inevitably burn out. They're not for actual rest, just for brief recharges before getting back to the grind.
AI-Powered Employee Monitoring System: Not for surveillance, of course! It's to "enhance productivity" and "identify areas for improvement" (read: track bathroom breaks).
Cafeteria with "Curated" Menu: Offering overpriced, slightly bland food options designed to keep employees on-site and minimize lunch break duration. Gluten-free and vegan options available, because we're not monsters (just ruthless capitalists).
Automated Climate Control (that you can't actually control): The building decides the temperature, not you. Embrace the chilly, productivity-enhancing air conditioning!

What Your Employees Will Silently Endure:
The Commute: Hours spent battling traffic, all to arrive at a building that feels like a mausoleum.
The Fluorescent Lights: They just never seem to turn off, much like the expectations of your superiors.
The Constant Pressure: To innovate, to collaborate, to "circle back," to "think outside the box," to "leverage synergies"—all while wondering if they'll ever afford a down payment on a house.
The Meaningless Perks: Free stale bagels on Fridays, ping-pong tables, and "casual Fridays" where everyone still dresses business casual.
The Existential Dread: The slow realization that their entire working life is being spent contributing to someone else's yacht fund.

If you're ready to solidify your corporate empire and provide a fittingly soul-crushing environment for your workforce, then acquire The "Soul Crusher" Tower today! Your shareholders will thank you (probably).`
  },
  {
    key: 'dataFortress',
    name: 'The "Omni-Vault"',
    image: '/home7.png',
    cost: 2500000000,
    wattage: 150000,
    blurb: 'Subterranean citadel for total data domination and maximum dread.',
    details: `🔒 Behold the "Omni-Vault": Your Digital Overlord's Headquarters! 🔒
Address: Core of the Nexus, Undisclosed Global Coordinates (Don't worry, your algorithm knows where it is.)
Price: $2,500,000,000 (Because controlling all information is, apparently, priceless... but still has a price tag)
Total Square Footage: 5,000,000 sq ft (Mostly subterranean, for optimal existential dread and heat dissipation)
Data Storage Capacity: Beyond human comprehension (It holds the internet, your deepest fears, and probably your grandmother's secret cookie recipe)
Occupants: A handful of highly-paid, paranoid technicians and an unfathomable number of servers.

Has your company achieved total, unquestionable dominance over every facet of human existence, from social media trends to global financial markets? Do you require a facility so utterly impenetrable and vast that it makes Fort Knox look like a piggy bank? Then welcome, supreme digital architects, to the "Omni-Vault"! This isn't just a data center; it's the nerve center of the new world, where every byte has a purpose, and that purpose is probably yours.

What Your Digital Empire Will Worship:
Subterranean Citadel Design: Hidden deep within a mountain range (or under the Mariana Trench, details are classified), ensuring maximum protection from meteorites, EMPs, and disgruntled former employees.
Military-Grade Security (and then some): Multi-layered biometric scanners, laser grids, armed drone patrols, and a philosophical AI that can predict threats before they exist. Getting in is impossible; getting out is even harder (if you're a data packet).
Self-Sustaining Eco-System: Powered by geothermal vents, quantum fusion, and the collective sighs of humanity as it scrolls through endless feeds. Capable of operating for centuries without external contact.
Cold Aisle Containment Pods for Servers (and occasionally, rogue employees): Thousands upon thousands of blinking lights, meticulously organized, representing the digital echoes of billions of lives. It's beautiful in a terrifying, sterile way.
The "Global Consciousness" Interface Room: A vast, dark chamber with holographic displays, allowing a select few to visualize, analyze, and subtly manipulate every data stream flowing through the planet. It's not control, it's optimization.
Automated Maintenance Drones: Thousands of spider-like robots tirelessly crawl the server racks, repairing, optimizing, and occasionally whispering existential questions to each other.
Zero-Trust Architecture (and Zero-Trust for its human operators): Every action, every access attempt is logged, cross-referenced, and audited by a superior AI. Because trust is for weak algorithms.
Geopolitically Neutral Territory (allegedly): So secure and independent, it makes Switzerland look like a bustling marketplace.
Employee Micro-Apartments (Optional): For those few, dedicated souls who live here. Spartan, functional, and equipped with a direct neural interface for continuous productivity.

What Humanity Will Unwittingly Provide (and you will profit from):
Every Click, Every Like, Every Purchase: It all flows here, aggregated, analyzed, and monetized.
Your Deepest Secrets and Desires: Unbeknownst to you, this facility holds the key to your every motivation.
The Future Itself: Because whoever controls the data, controls the narrative, and therefore, controls everything.
A Continuous Stream of Energy: The sheer effort of billions of humans living their digital lives powers this behemoth. It's a closed loop system!

If you're ready to transcend mere commerce and become a literal custodian of civilization's digital soul (and all its exploitable data), then acquire the "Omni-Vault" today! It's not just an asset; it's destiny.`
  }
];

const purchasedMap = computed(() => props.gameState.realEstate || {});

const selectedIndex = ref(-1);
const selected = computed(() => (selectedIndex.value >= 0 ? properties[selectedIndex.value] : null));

function canBuyProperty(idx) {
  const prop = properties[idx];
  if (purchasedMap.value[prop.key]) return false;
  // Enforce order; fortress requires first six
  if (prop.key === 'dataFortress') {
    for (let i = 0; i < 6; i++) if (!purchasedMap.value[properties[i].key]) return false;
    return props.gameState.currentColdCoins >= prop.cost;
  }
  // Prior property must be owned (except first)
  if (idx > 0 && !purchasedMap.value[properties[idx - 1].key]) return false;
  return props.gameState.currentColdCoins >= prop.cost;
}

function buy(idx) {
  const prop = properties[idx];
  if (!canBuyProperty(idx)) return;
  if (!confirm(`Are you sure you want to buy "${prop.name}" for ${prop.cost.toLocaleString()} 💰?`)) return;
  props.gameState.currentColdCoins -= prop.cost;
  props.gameState.maxWattage += prop.wattage;
  props.gameState.realEstate[prop.key] = true;
  emit('purchased');
}

function openDetails(i) { selectedIndex.value = i; }
function closeDetails() { selectedIndex.value = -1; }

// Ridiculous mortgage calculator (toggle per-details)
const showMortgage = ref(false);
const mortDownPct = ref(0);
const mortRateAnnual = ref(12); // 12% default, ridiculous
const mortYears = ref(50); // 50-year mortgage
const monthlyPayment = computed(() => {
  if (!selected.value) return 0;
  const price = selected.value.cost;
  const down = Math.max(0, Math.min(99, mortDownPct.value)) / 100 * price;
  const L = Math.max(0, price - down);
  const r = (Math.max(0.01, mortRateAnnual.value) / 100) / 12; // monthly rate
  const n = Math.max(12, mortYears.value * 12);
  const payment = L * r / (1 - Math.pow(1 + r, -n));
  return isFinite(payment) ? Math.ceil(payment) : 0;
});

</script>

<template>
  <div v-if="show" class="re-modal-overlay" @click="$emit('close')">
    <div class="re-modal" @click.stop>
      <div class="re-header">
        <h2>🏠 Real Estate</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="re-content">
        <div class="re-grid">
          <div v-for="(p, i) in properties" :key="p.key" class="re-card" :class="{ owned: purchasedMap[p.key] }">
            <img :src="p.image" :alt="p.name" />
            <div class="re-info">
              <h3>{{ p.name }}</h3>
              <p class="blurb">{{ p.blurb }}</p>
              <div class="meta">
                <span class="price">{{ p.cost.toLocaleString() }} 💰</span>
                <span class="power">+{{ p.wattage }}W</span>
              </div>
            </div>
            <div class="re-actions">
              <button class="details-btn" @click="openDetails(i)">Details</button>
              <button 
                class="purchase-btn"
                :disabled="purchasedMap[p.key] || !canBuyProperty(i)"
                @click="buy(i)">
                {{ purchasedMap[p.key] ? 'Owned' : (canBuyProperty(i) ? 'Purchase' : 'Locked') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Drawer -->
      <div v-if="selected" class="re-details-overlay" @click="closeDetails">
        <div class="re-details" @click.stop>
          <!-- Header attached to card -->
          <div class="details-header">
            <h3>{{ selected.name }}</h3>
            <button class="close-btn" @click="closeDetails">×</button>
          </div>

          <!-- Banner image attached directly under header -->
          <div class="details-hero">
            <img :src="selected.image" :alt="selected.name" />
          </div>

          <!-- Two-column real-estate layout -->
          <div class="details-content">
            <div class="details-main">
              <div class="summary-row">
                <div class="summary-item">
                  <div class="summary-label">Price</div>
                  <div class="summary-value">{{ selected.cost.toLocaleString() }} 💰</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Wattage Gain</div>
                  <div class="summary-value">+{{ selected.wattage }}W</div>
                </div>
              </div>
              <div class="details-text-rich">
                <pre>{{ selected.details }}</pre>
              </div>
            </div>
            <aside class="details-aside">
              <div class="aside-card">
                <div class="aside-price">{{ selected.cost.toLocaleString() }} 💰</div>
                <div class="aside-sub">Adds +{{ selected.wattage }}W capacity</div>
                <button 
                  class="aside-buy"
                  :disabled="!canBuyProperty(selectedIndex) || purchasedMap[selected.key]"
                  @click="buy(selectedIndex)">
                  {{ purchasedMap[selected.key] ? 'Owned' : (canBuyProperty(selectedIndex) ? 'Buy Property' : 'Locked') }}
                </button>
                <div class="aside-note">Purchases are permanent and unlock in order.</div>

                <div class="mortgage">
                  <button class="mortgage-toggle aside-buy locked-look" @click="showMortgage = !showMortgage">Mortgage Options</button>
                  <div v-if="showMortgage" class="mortgage-body">
                    <div class="mort-row"><label>Down Payment %</label><input type="number" v-model.number="mortDownPct" min="0" max="99" @keydown.stop @keyup.stop @keypress.stop /></div>
                    <div class="mort-row"><label>Annual Rate %</label><input type="number" v-model.number="mortRateAnnual" min="1" step="0.1" @keydown.stop @keyup.stop @keypress.stop /></div>
                    <div class="mort-row"><label>Years</label><input type="number" v-model.number="mortYears" min="10" @keydown.stop @keyup.stop @keypress.stop /></div>
                    <div class="mort-result">Monthly: <strong>{{ monthlyPayment.toLocaleString() }}</strong> 💰</div>
                    <div class="mort-disclaimer">Assumes compounding monthly. Rates are intentionally absurd.</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10010; }
.re-modal { width: 90%; max-width: 1200px; height: 80%; background: var(--bg-color); border: 2px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; }
.re-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--menu-bar-bg); }
.close-btn { background: none; border: none; color: var(--font-color); font-size: 2rem; cursor: pointer; }
.re-content { padding: 16px; overflow: auto; }
.re-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.re-card { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
.re-card.owned { border-color: #22c55e; box-shadow: 0 0 0 1px rgba(34,197,94,0.3); }
.re-card img { width: 100%; height: 180px; object-fit: contain; background: var(--bg-color); }
.re-info { padding: 12px; }
.re-info h3 { margin: 0 0 6px 0; color: var(--font-color); font-size: 1rem; }
.blurb { color: var(--gray); font-size: 0.85rem; min-height: 44px; }
.meta { display: flex; justify-content: space-between; color: var(--font-color); margin-top: 8px; font-weight: bold; }
.re-actions { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.re-actions .details-btn { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; background: var(--bg-color); color: var(--font-color); font-weight: 600; }
.re-actions .purchase-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; background: var(--keyword); color: #fff; font-weight: bold; font-size: 1rem; }
.re-actions button:disabled { background: #444; color: #bbb; cursor: not-allowed; }

.re-details-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10020; }
.re-details { width: 90%; max-width: 1100px; max-height: 88%; background: var(--bg-color); border: 2px solid var(--border-color); border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.details-header { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--menu-bar-bg); border-bottom: 1px solid var(--border-color); z-index: 1; }
.details-hero { position: relative; width: 100%; height: 380px; overflow: hidden; border-bottom: 1px solid var(--border-color); }
.details-hero img { width: 100%; height: 100%; object-fit: cover; }
.details-content { display: grid; grid-template-columns: 1.8fr 1fr; gap: 16px; padding: 16px; overflow: auto; margin-top: -1px; border-top: 1px solid var(--border-color); }
.details-main { min-width: 0; }
.summary-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
.summary-item { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 12px; }
.summary-label { color: var(--gray); font-size: 0.8rem; margin-bottom: 4px; }
.summary-value { color: var(--font-color); font-weight: 700; }
.details-text-rich { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; }
.details-text-rich pre { white-space: pre-wrap; color: var(--font-color); font-family: inherit; line-height: 1.5; }
.details-aside { min-width: 260px; }
.aside-card { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; position: sticky; top: 8px; }
.aside-price { color: var(--font-color); font-weight: 800; font-size: 1.2rem; }
.aside-sub { color: var(--gray); margin: 6px 0 12px; }
.aside-buy { width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; background: var(--keyword); color: #fff; font-weight: bold; font-size: 1rem; }
.aside-buy:disabled { background: #444; color: #bbb; cursor: not-allowed; }
.aside-note { color: var(--gray); font-size: 0.8rem; margin-top: 10px; }
.locked-look { background: #444 !important; color: #bbb !important; border: none; }
.mortgage { margin-top: 14px; }
.mortgage-toggle { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); color: var(--font-color); cursor: pointer; font-weight: 600; }
.mortgage-body { margin-top: 10px; display: grid; gap: 8px; }
.mort-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: center; }
.mort-row label { color: var(--gray); font-size: 0.85rem; }
.mort-row input { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--font-color); }
.mort-result { color: var(--font-color); font-size: 1rem; }
.mort-disclaimer { color: var(--gray); font-size: 0.75rem; }
</style>

