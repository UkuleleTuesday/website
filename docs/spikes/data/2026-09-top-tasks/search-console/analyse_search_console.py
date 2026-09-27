import csv, re, collections, datetime
def load(name):
    with open(name, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))
def num(s):
    s=s.replace('%','').replace(',','')
    return float(s) if s else 0.0

print("=== PAGES (all) ===")
pages=load('Pages.csv')
tot_clicks=sum(num(r['Clicks']) for r in pages); tot_imp=sum(num(r['Impressions']) for r in pages)
for r in pages:
    print(f"{int(num(r['Clicks'])):6d} clicks {int(num(r['Impressions'])):7d} imp  CTR {r['CTR']:>7}  pos {r['Position']:>5}  {r['Top pages']}")
print(f"TOTAL pages: {int(tot_clicks)} clicks, {int(tot_imp)} impressions")

print("\n=== DEVICES ==="); 
for r in load('Devices.csv'): print(r)
print("\n=== COUNTRIES top 12 ===")
for r in load('Countries.csv')[:12]: print(f"{int(num(r['Clicks'])):5d} clicks {int(num(r['Impressions'])):6d} imp  {r['Country']}")

print("\n=== DAILY SERIES: monthly + weekday ===")
chart=load('Chart.csv')
bym=collections.defaultdict(lambda:[0,0]); bywd=collections.defaultdict(lambda:[0,0,0])
dates=[]
for r in chart:
    d=datetime.date.fromisoformat(r['Date']); dates.append(d)
    bym[d.strftime('%Y-%m')][0]+=num(r['Clicks']); bym[d.strftime('%Y-%m')][1]+=num(r['Impressions'])
    bywd[d.weekday()][0]+=num(r['Clicks']); bywd[d.weekday()][1]+=num(r['Impressions']); bywd[d.weekday()][2]+=1
print("range:", min(dates), "to", max(dates), "days:", len(dates))
for m in sorted(bym): print(f"  {m}: {int(bym[m][0]):5d} clicks {int(bym[m][1]):6d} imp")
wd=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
for k in range(7): print(f"  {wd[k]}: avg {bywd[k][0]/bywd[k][2]:5.1f} clicks/day, avg {bywd[k][1]/bywd[k][2]:6.1f} imp/day")
tc=sum(num(r['Clicks']) for r in chart); ti=sum(num(r['Impressions']) for r in chart)
print(f"TOTAL daily: {int(tc)} clicks, {int(ti)} impressions, avg {tc/len(chart):.1f} clicks/day")

print("\n=== QUERIES ===")
q=load('Queries.csv')
for r in q: r['c']=num(r['Clicks']); r['i']=num(r['Impressions']); r['q']=r['Top queries'].lower()
qc=sum(r['c'] for r in q); qi=sum(r['i'] for r in q)
print(f"queries: {len(q)}, total {int(qc)} clicks, {int(qi)} impressions (anonymised long tail excluded)")
brand=re.compile(r"ukulele\s*tuesday|uke\s*tuesday|ukelele\s*tuesday|ukulele\s*tuesdays|ukulele tues|ukuleletuesday|ukulele\s*thursday")
groups=[
 ("brand only", lambda s: brand.search(s) and not re.search(r"songbook|song book|songs|chords|book us|booking|hire|whatsapp|code of conduct|christmas|valentine|halloween|pdf|contact|donat|support", s)),
 ("songbook / songs / chords", lambda s: re.search(r"songbook|song book|songs?\b|chords?|tabs?\b|lyrics|pdf|sheet", s)),
 ("session / what is / where / when", lambda s: re.search(r"session|jam|stag|dame|tuesday night|tonight|this week|open|time|when|where|near me|things to do|what to do|pub|free|beginner|join|meetup|meet up|club|group", s)),
 ("learn / lessons / workshop", lambda s: re.search(r"lesson|class|learn|teach|workshop|course|tutor", s)),
 ("booking / band / hire", lambda s: re.search(r"\bband\b|hire|book(ing)?\b|wedding|corporate|festival|perform|gig|concert|orchestra|ensemble", s)),
 ("whatsapp / community", lambda s: re.search(r"whatsapp|community|facebook|instagram", s)),
 ("code of conduct / policy", lambda s: re.search(r"code of conduct|conduct|policy|rules", s)),
 ("donate / support", lambda s: re.search(r"donat|support|buy me a coffee|bmc", s)),
 ("press / testimonials", lambda s: re.search(r"press|testimonial|review", s)),
 ("buy a ukulele / shops", lambda s: re.search(r"buy|shop|store|price|cheap|best ukulele|brand", s)),
]
assigned={}
agg=collections.OrderedDict((g,[0,0,0]) for g,_ in groups); agg['other']=[0,0,0]
for r in q:
    g='other'
    for name,fn in groups:
        if fn(r['q']): g=name; break
    assigned[r['q']]=g; agg[g][0]+=r['c']; agg[g][1]+=r['i']; agg[g][2]+=1
print("\n--- intent groups (clicks / impressions / #queries) ---")
for g,(c,i,n) in agg.items(): print(f"  {g:38s} {int(c):5d} clicks ({100*c/qc:4.1f}%)  {int(i):6d} imp ({100*i/qi:4.1f}%)  {n:3d} queries")
bc=sum(r['c'] for r in q if brand.search(r['q'])); bi=sum(r['i'] for r in q if brand.search(r['q']))
print(f"\nbrand-containing queries: {int(bc)} clicks ({100*bc/qc:.1f}%), {int(bi)} imp ({100*bi/qi:.1f}%)")

def show(title, rows, n=40):
    print(f"\n--- {title} ---")
    for r in rows[:n]: print(f"  {int(r['c']):4d} c {int(r['i']):6d} i  CTR {r['CTR']:>7} pos {r['Position']:>5}  [{assigned[r['q']]}]  {r['Top queries']}")
show("top 45 by clicks", sorted(q,key=lambda r:-r['c']), 45)
show("top 40 non-brand by impressions", sorted([r for r in q if not brand.search(r['q'])],key=lambda r:-r['i']), 40)
show("T1 signals: tonight/this week/open/time/when/where/on tuesday/bank holiday", [r for r in q if re.search(r"tonight|this week|open|\btime\b|when|where|is it on|bank holiday|today|what time|start", r['q'])], 40)
show("booking / hire / band / wedding / festival / workshop / lessons", [r for r in q if assigned[r['q']] in ('booking / band / hire','learn / lessons / workshop')], 60)
show("press / testimonials / faq / code of conduct / whatsapp / donate", [r for r in q if re.search(r"press|testimonial|review|faq|conduct|whatsapp|donat|support", r['q'])], 40)
show("queries mentioning dublin (non-brand)", [r for r in q if 'dublin' in r['q'] and not brand.search(r['q'])], 40)
