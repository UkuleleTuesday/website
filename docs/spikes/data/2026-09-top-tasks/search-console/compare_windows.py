import csv, re, collections, datetime
def load(d,name):
    with open(f"{d}/{name}", encoding='utf-8-sig') as f: return list(csv.DictReader(f))
def num(s): s=s.replace('%','').replace(',',''); return float(s) if s else 0.0
A='last-12-months'; B='last-3-months'
ca=load(A,'Chart.csv'); cb=load(B,'Chart.csv')
da=len(ca); db=len(cb)
print(f"12m: {da} days, 3m: {db} days")
# apex + pages side by side, normalised per 30 days
pa={r['Top pages']:(num(r['Clicks']),num(r['Impressions'])) for r in load(A,'Pages.csv')}
pb={r['Top pages']:(num(r['Clicks']),num(r['Impressions'])) for r in load(B,'Pages.csv')}
print("\n=== PAGES per 30 days: 12-month window vs last-3-month window ===")
print(f"{'page':58s} {'12m clk/30d':>11s} {'3m clk/30d':>10s}   {'12m imp/30d':>11s} {'3m imp/30d':>10s}")
for p in sorted(set(pa)|set(pb), key=lambda p:-(pa.get(p,(0,0))[1]+pb.get(p,(0,0))[1])):
    a=pa.get(p,(0,0)); b=pb.get(p,(0,0))
    print(f"{p.replace('https://',''):58s} {a[0]/da*30:11.1f} {b[0]/db*30:10.1f}   {a[1]/da*30:11.0f} {b[1]/db*30:10.0f}")
# last 3 months of the 12m chart vs 3m chart
cut=min(datetime.date.fromisoformat(r['Date']) for r in cb)
sub=[r for r in ca if datetime.date.fromisoformat(r['Date'])>=cut]
print(f"\n12m chart restricted to >= {cut}: {sum(num(r['Clicks']) for r in sub):.0f} clicks / {sum(num(r['Impressions']) for r in sub):.0f} imp over {len(sub)} days")
print(f"3m chart: {sum(num(r['Clicks']) for r in cb):.0f} clicks / {sum(num(r['Impressions']) for r in cb):.0f} imp over {db} days")
# weekday in 3m
bywd=collections.defaultdict(lambda:[0,0])
for r in cb:
    d=datetime.date.fromisoformat(r['Date']); bywd[d.weekday()][0]+=num(r['Clicks']); bywd[d.weekday()][1]+=1
wd=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
print("\n3m weekday avg clicks/day: "+", ".join(f"{wd[k]} {bywd[k][0]/bywd[k][1]:.1f}" for k in range(7)))
# devices, countries
print("\n3m devices:", [(r['Device'],r['Clicks'],r['Impressions'],r['CTR']) for r in load(B,'Devices.csv')])
cb_c=load(B,'Countries.csv'); tot=sum(num(r['Clicks']) for r in cb_c)
print("3m countries top5:", [(r['Country'],int(num(r['Clicks'])),f"{100*num(r['Clicks'])/tot:.0f}%") for r in cb_c[:5]])
# queries: top 25 in 3m, and intent groups
qb=load(B,'Queries.csv'); qa=load(A,'Queries.csv')
brand=re.compile(r"ukulele\s*tuesday|uke\s*tuesday|ukelele\s*tuesday|ukulele\s*tuesdays|ukuleletuesday")
def grp(s):
    if brand.search(s) and not re.search(r"songbook|song book|songs|chords", s): return "brand"
    if brand.search(s): return "brand+songbook"
    if re.search(r"songbook|song book|songs?\b|chords?|tabs?\b|lyrics|pdf|sheet", s): return "generic songbook"
    if re.search(r"\bband\b|hire|wedding|corporate|perform|gig|concert|orchestra|ensemble", s): return "booking/band"
    if re.search(r"lesson|class|learn|teach|workshop|course", s): return "learning"
    if re.search(r"session|jam|stag|tuesday night|tonight|open|time|when|where|near me|things to do|pub|free|beginner|join|meetup|club|group|dublin|ireland", s): return "discovery"
    return "other"
for label,q,days in (("12m",qa,da),("3m",qb,db)):
    agg=collections.defaultdict(lambda:[0,0])
    for r in q: g=grp(r['Top queries'].lower()); agg[g][0]+=num(r['Clicks']); agg[g][1]+=num(r['Impressions'])
    print(f"\n{label} intent groups per 30 days (clicks / impressions):")
    for g in ("brand","brand+songbook","generic songbook","discovery","learning","booking/band","other"):
        print(f"   {g:18s} {agg[g][0]/days*30:7.1f} / {agg[g][1]/days*30:8.0f}")
print("\n3m top 25 queries by clicks:")
for r in sorted(qb,key=lambda r:-num(r['Clicks']))[:25]: print(f"  {int(num(r['Clicks'])):4d} c {int(num(r['Impressions'])):5d} i pos {r['Position']:>5}  {r['Top queries']}")
print("\n3m booking/band + learning queries (all):")
for r in qb:
    if grp(r['Top queries'].lower()) in ('booking/band','learning'): print(f"  {int(num(r['Clicks'])):3d} c {int(num(r['Impressions'])):5d} i pos {r['Position']:>5}  {r['Top queries']}")
