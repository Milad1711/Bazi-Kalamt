#!/usr/bin/env python3
# Fix word bank issues in bank-c.ts (and verify bank-a/b integrity)
import re, sys

p = '/home/z/my-project/src/lib/game/words/bank-c.ts'
s = open(p, encoding='utf-8').read()

fixes = [
    # (old, new, description)
    ("'up', 'wall-e', 'shrek'", "'shrek'", "remove up/wall-e"),
    ("'wall-e', 'up',", "", "remove wall-e,up alt"),
    ("'homeont_range', ", "", "remove homeont_range"),
    ("'اتللو', ", "", "remove اتللو (play not movie brand)"),
    ("'بلندوکوتاه', ", "", "remove بلندوکوتاه"),
    ("'صدوبیست', ", "", "remove صدوبیست"),
    ("'شبهایقل', ", "", "remove شبهایقل"),
    ("'سinderella', ", "'سیندرلا', ", "fix سinderella"),
    ("'چاپSTEM', ", "", "remove چاپSTEM"),
    ("'دزد دریایی'", "'دزددریایی'", "fix space in دزد دریایی"),
    ("'جادوگره', ", "", "remove جادوگره"),
    ("'آمفی تئاتر'", "'آمفیتئاتر'", "fix space آمفی تئاتر"),
    ("'کاغذبازی', ", "", "remove کاغذبازی"),
    ("'ماشیناسباببازی'", "'اسباببازی'", "shorten ماشیناسباببازی"),
    ("'گلرز', ", "'رز', ", "fix گلرز"),
    ("'سفرعروس', ", "'ماهعسل', ", "fix سفرعروس"),
    ("'وسلم', 'باخت',", "'باخت',", "remove وسلم"),
    ("'قلبشناسی', ", "", "remove قلبشناسی"),
    ("\"سمشناسی\"", "'سمشناسی'", "normalize quotes سمشناسی"),
    ("'روشنسازی', ", "", "remove روشنسازی"),
]

for old, new, desc in fixes:
    if old in s:
        s = s.replace(old, new, 1)
        print(f"OK   {desc}")
    else:
        print(f"SKIP {desc} (not found)")

open(p, 'w', encoding='utf-8').write(s)
print("done")
