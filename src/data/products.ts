export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Foldable Camping Stool",
    price: 349.99,
    image: "https://rukminim2.flixcart.com/image/612/612/xif0q/stool/r/j/i/5-15-1-0-300-handbag-folding-stool-zipper-bag-foldable-camping-original-imah4qtc3fnauu4d.jpeg?q=70",
    category: "Housery",
    description: "Portable and lightweight foldable camping stool that easily fits in your bag. Perfect for outdoor adventures, fishing, hiking, and picnics. Supports up to 300 lbs with a durable steel frame and comfortable padded seat. Folds flat for easy storage and comes with a convenient carry bag."
  },
  {
    id: 2,
    name: "Back Massager",
    price: 849.99,
    image: "https://5.imimg.com/data5/SELLER/Default/2025/3/492449585/FG/YX/KG/99744923/4-head-massage-gun-4-headed-massager-gun-deep-tissue-neck-and-shoulder-massager-body-massager-1000x1000.jpg",
    category: "Massager",
    description: "Professional 4-head deep tissue massage gun for neck, shoulders, and full body relief. Features multiple speed settings that provide targeted muscle recovery and deep relaxation. Rechargeable long-lasting battery for cordless convenience. Whisper-quiet motor with ergonomic grip design."
  },
  {
    id: 3,
    name: "Reusable Double Chin Reducer",
    price: 199.99,
    image: "https://th.bing.com/th/id/R.6a94fd4f0f248f4a5aa06f3e38b55280?rik=clPILsUw%2fIO5%2fg&riu=http%3a%2f%2f5.imimg.com%2fdata5%2fSELLER%2fDefault%2f2024%2f4%2f413029658%2fWN%2fVX%2fNS%2f99744923%2freusable-double-chin-reducer-chin-strap-v-shape-face-slimming-strap-face-slimmer-shaper-for-women-1000x1000.jpg&ehk=qqbjKygkVAMEVMUC3TCUJIZUbse%2f2n3GmVc12K9j0Bw%3d&risl=&pid=ImgRaw&r=0",
    category: "Wearables",
    description: "V-shape face slimming strap designed to reduce double chin appearance. Reusable, comfortable, and fully adjustable chin strap that helps contour and define your jawline naturally. Made from breathable, skin-friendly material. Wear it while sleeping or relaxing for effortless results."
  },
  {
    id: 4,
    name: "Heart Shaped Purse Light",
    price: 299.99,
    image: "https://tse1.mm.bing.net/th/id/OIP.xTc9oClbXzUTIH-ud4IgMwHaHa?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: "Accessories",
    description: "Adorable heart-shaped LED purse light that illuminates the inside of your bag instantly. Touch-activated sensor with a long-lasting battery life. A perfect stylish and practical accessory for any handbag, tote, or clutch. Makes a wonderful gift for friends and family."
  },
  {
    id: 5,
    name: "3 Sided Toothbrush",
    price: 49.99,
    image: "https://down-ph.img.susercontent.com/file/ph-11134208-7r98p-lyxh3zzs02da97",
    category: "Toiletries",
    description: "Innovative 3-sided toothbrush design that cleans all tooth surfaces simultaneously — front, back, and top — in one stroke. Provides thorough brushing in less time with ultra-soft bristles for gentle gum care. Ideal for kids, elderly, and anyone who wants a quicker, more efficient brushing experience."
  },
  {
    id: 6,
    name: "Shoe Washing Machine Bag",
    price: 249.99,
    image: "https://img.kwcdn.com/product/open/0189276f3ee74de4a50705d3663a4a85-goods.jpeg?imageView2/2/w/500/q/70/format/webp",
    category: "Washing",
    description: "Protective mesh laundry bag designed specifically for washing shoes in the machine. Prevents damage to both shoes and your washing machine drum while ensuring thorough cleaning. Features a padded inner frame, sturdy zipper closure, and fits most shoe sizes. Save time and effort on shoe cleaning."
  },
  {
    id: 7,
    name: "Stainless Steel Rust Remover",
    price: 89,
    image: "https://i.postimg.cc/x1B3YZtB/image.png",
    category: "Washing",
    description: "Powerful stainless steel rust remover that restores metal surfaces to their original shine. Easy-to-apply formula that works on kitchen utensils, tools, appliances, and outdoor furniture. Non-toxic and safe for household use. Simply apply, wait, and wipe for sparkling clean results."
  },
  {
    id: 8,
    name: "4 in 1 Tile Cleaning Brush",
    price: 299,
    image: "https://i.postimg.cc/RVkPmkjB/Whats-App-Image-2026-02-01-at-05-39-17-(1).jpg",
    category: "Cleaning",
    description: "Versatile 4-in-1 tile cleaning brush with interchangeable heads for grout lines, flat tiles, corners, and textured surfaces. Long ergonomic handle reduces back strain and makes bathroom, kitchen, and floor cleaning effortless. Durable bristles that won't scratch delicate surfaces."
  },
  {
    id: 9,
    name: "2 in 1 Oil Spray Bottle",
    price: 179,
    image: "https://i.postimg.cc/hjXycKPS/Whats-App-Image-2026-02-01-at-05-39-17.jpg",
    category: "Kitchen",
    description: "Dual-function oil spray bottle for precise cooking oil application. Features both a fine mist spray and a pour spout for healthy, controlled oil usage in cooking, baking, and grilling. Food-grade glass construction with a measurement scale. Reduces oil consumption by up to 90%."
  },
  {
    id: 10,
    name: "Acupressure Socks with Stick",
    price: 149,
    image: "https://i.postimg.cc/fW02PWP4/Whats-App-Image-2026-02-01-at-05-39-18-(1).jpg",
    category: "Health",
    description: "Therapeutic acupressure socks with an included massage stick for targeted foot reflexology. Features mapped pressure point indicators that guide you to key areas for pain relief, improved blood circulation, and overall wellness. Comfortable cotton blend material suitable for daily wear."
  },
  {
    id: 11,
    name: "Anti Smoke Patch (Pack of 10)",
    price: 99,
    image: "https://i.postimg.cc/K8QJT11S/Whats-App-Image-2026-02-01-at-05-39-18-(2).jpg",
    category: "Health",
    description: "Natural anti-smoking patches that help reduce cigarette cravings throughout the day. Pack of 10 patches with herbal ingredients that promote a gradual, comfortable transition to a smoke-free lifestyle. Discreet, waterproof design that can be worn under clothing for up to 24 hours."
  },
  {
    id: 12,
    name: "47 in 1 Electric Screwdriver",
    price: 429,
    image: "https://i.postimg.cc/2ypwYvK2/Whats-App-Image-2026-02-01-at-05-39-18.jpg",
    category: "Tools",
    description: "Compact electric screwdriver kit with 47 precision bits for all your DIY and repair needs. Rechargeable via USB-C, cordless design with a magnetic bit holder and built-in LED work light. Features forward/reverse rotation, adjustable torque, and an ergonomic lightweight body."
  },
  {
    id: 13,
    name: "Hair Straightening Comb",
    price: 349,
    image: "https://i.postimg.cc/dtjBMhmS/Whats-App-Image-2026-02-01-at-05-39-19-(1).jpg",
    category: "Beauty",
    description: "Electric hair straightening comb that detangles and straightens simultaneously in minutes. Ceramic heating plates with 5 adjustable temperature settings for all hair types — from fine to coarse. Quick 30-second heat-up technology, anti-scald design, and auto shut-off for safety."
  },
  {
    id: 14,
    name: "EMS Foot Massager",
    price: 199,
    image: "https://i.postimg.cc/GpVPPGdn/Whats-App-Image-2026-02-01-at-05-39-19.jpg",
    category: "Health",
    description: "Electronic muscle stimulation (EMS) foot massager mat for deep relaxation after long days. Features 6 massage modes and 9 intensity levels to relieve foot fatigue, reduce swelling, and improve blood circulation. Foldable, portable design that can be used anywhere — at home or office."
  },
  {
    id: 15,
    name: "Low Voltage Wire Connector",
    price: 169,
    image: "https://i.postimg.cc/7hygd4Ck/Whats-App-Image-2026-02-01-at-05-39-20-(1).jpg",
    category: "Electrical",
    description: "Quick-connect low voltage wire connectors for easy and secure electrical connections. No wire stripping required — just push and connect. Suitable for various wire gauges from 12 to 28 AWG. Transparent housing lets you verify proper connection. Perfect for LED lighting, speakers, and automotive wiring."
  },
  {
    id: 16,
    name: "Magnetic Gas Level Indicator",
    price: 149,
    image: "https://i.postimg.cc/tCkhSLpD/Whats-App-Image-2026-02-01-at-05-39-20-(2).jpg",
    category: "Kitchen",
    description: "Easy-to-use magnetic indicator that shows the remaining gas level in your LPG cylinder at a glance. Simply attach it to the side of the cylinder with the built-in magnet — no batteries or tools needed. Temperature-sensitive strip changes color to show exact gas level. Never run out of gas unexpectedly again."
  },
  {
    id: 17,
    name: "Nose Trimmer",
    price: 119,
    image: "https://i.postimg.cc/tCq6x2Wc/Whats-App-Image-2026-02-01-at-05-39-21-(1).jpg",
    category: "Personal Care",
    description: "Compact and precise nose hair trimmer with dual-edge stainless steel rotary blades for painless trimming. Ergonomic pen-style design for easy handling. Battery-operated for portable grooming on the go. Also works for ear hair and eyebrow detailing. Includes a protective cap and cleaning brush."
  },
  {
    id: 18,
    name: "Hand Coffee Grinder",
    price: 449,
    image: "https://i.postimg.cc/B62Fxzm8/Whats-App-Image-2026-02-01-at-05-39-20.jpg",
    category: "Kitchen",
    description: "Manual ceramic burr coffee grinder for the freshest ground coffee anywhere you go. Adjustable grind settings from fine espresso to coarse French press with consistent results every time. Portable, durable stainless steel body with a comfortable crank handle. Holds enough beans for 2-3 cups."
  },
  {
    id: 19,
    name: "Rechargeable Hand Warmer",
    price: 299,
    image: "https://i.postimg.cc/d1cktBJk/Whats-App-Image-2026-02-01-at-05-39-21-(2).jpg",
    category: "Electronics",
    description: "Double-sided rechargeable hand warmer with 3 heating levels (low, medium, high) for customizable warmth. Also doubles as a portable 5000mAh power bank to charge your phone on the go. Heats up in seconds and lasts up to 8 hours on a single charge. Compact, pocket-sized design perfect for winter."
  },
  {
    id: 20,
    name: "Mini Shaver",
    price: 199,
    image: "https://i.ibb.co/XZv0z4v3/Whats-App-Image-2026-02-01-at-05-39-21.jpg",
    category: "Personal Care",
    description: "Ultra-compact mini electric shaver for quick touch-ups and clean grooming on the go. USB rechargeable with a powerful yet quiet motor for a clean, smooth shave. Pocket-sized convenience with a travel-friendly design. Hypoallergenic floating blade adapts to facial contours for irritation-free results."
  },
  {
    id: 21,
    name: "Silicon Body Scrubber Bath Brush",
    price: 99,
    image: "https://i.ibb.co/Zzbjsg5c/Whats-App-Image-2026-02-01-at-05-39-22-1.jpg",
    category: "Bath",
    description: "Hygienic silicone body scrubber that gently exfoliates dead skin cells and massages your body. Easy to clean, quick-drying, and far more sanitary than traditional loofahs or washcloths. Soft, flexible bristles are gentle on sensitive skin. Creates a rich lather with minimal soap usage and lasts for years."
  },
  {
    id: 22,
    name: "Shoe Cleaner Eraser",
    price: 79,
    image: "https://i.ibb.co/F4VGSNxH/Whats-App-Image-2026-02-01-at-05-39-22.jpg",
    category: "Cleaning",
    description: "Magic eraser sponge specifically designed for cleaning sneakers, leather shoes, and canvas footwear. Effortlessly removes scuff marks, dirt, grass stains, and yellowing without water or harsh chemicals. Works on rubber soles, leather uppers, and fabric materials. Compact and portable for on-the-go cleaning."
  }
];

export function calculateTotals(subtotal: number) {
  const tax = subtotal * 0.18;
  const shipping = subtotal * 0.10;
  const handling = subtotal * 0.10;
  const total = subtotal + shipping + handling;
  return { subtotal, tax, shipping, handling, total };
}
