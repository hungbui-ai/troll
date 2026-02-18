import discord
from discord.ext import commands
import asyncio, requests, re, os
from flask import Flask
from threading import Thread

# ================= ĐỌC TỪ RENDER SETTINGS =================
TOKEN_DISCORD = os.getenv("DISCORD_TOKEN")
API_TDS = os.getenv("TDS_API_KEY")
PROXY_DEFAULT = os.getenv("PROXY") 
# ==========================================================

bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())
bot.is_running = False
bot.stats = {"job": 0, "current_id": "Chưa có", "status": "🔴 Đang dừng", "coin": "0"}
bot.status_msg = None 

class FB_Auto:
    def __init__(self, proxy_str=None):
        self.s = requests.Session()
        self.s.headers.update({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        })
        if proxy_str:
            try:
                p = proxy_str.split(':')
                px = f"http://{p[2]}:{p[3]}@{p[0]}:{p[1]}" if len(p) == 4 else f"http://{p[0]}:{p[1]}"
                self.s.proxies = {"http": px, "https": px}
            except: pass

    def get_2fa(self, key):
        try:
            res = requests.get(f"https://2fa.live/tok/{key.strip().replace(' ', '')}").json()
            return res.get("token")
        except: return None

    def login(self, u, p, k):
        try:
            r1 = self.s.get("https://mbasic.facebook.com/login.php", timeout=15)
            lsd = re.search(r'name="lsd" value="(.*?)"', r1.text).group(1)
            jazoest = re.search(r'name="jazoest" value="(.*?)"', r1.text).group(1)
            data = {'lsd':lsd, 'jazoest':jazoest, 'email':u, 'pass':p, 'login':'Log In'}
            r2 = self.s.post("https://mbasic.facebook.com/login.php", data=data, timeout=15)
            if "checkpoint" in r2.url or "approvals_code" in r2.text:
                code = self.get_2fa(k)
                if not code: return None
                fb_dtsg = re.search(r'name="fb_dtsg" value="(.*?)"', r2.text).group(1)
                nh = re.search(r'name="nh" value="(.*?)"', r2.text).group(1)
                r3 = self.s.post("https://mbasic.facebook.com/login/checkpoint/", data={'fb_dtsg':fb_dtsg,'jazoest':jazoest,'approvals_code':code,'submit[Submit Code]':'Submit Code','nh':nh})
                for _ in range(5):
                    if "c_user" in self.s.cookies.get_dict(): break
                    nh_m = re.search(r'name="nh" value="(.*?)"', r3.text)
                    if not nh_m: break
                    r3 = self.s.post("https://mbasic.facebook.com/login/checkpoint/", data={'submit[Continue]':'Continue','nh':nh_m.group(1)})
            ck = self.s.cookies.get_dict()
            return "".join([f"{k}={v}; " for k, v in ck.items()]) if "c_user" in ck else None
        except: return None

def tds_api(ep, pa={}):
    pa['access_token'] = API_TDS
    try: return requests.get(f"https://traodoisub.com/api/{ep}", params=pa, timeout=15).json()
    except: return {}

async def update_status_embed(channel):
    if not channel: return
    embed = discord.Embed(title="📊 TDS AUTO STATUS", color=0x2ecc71 if bot.is_running else 0xe74c3c)
    embed.add_field(name="Trạng thái", value=bot.stats["status"], inline=True)
    embed.add_field(name="Xu", value=f"💰 {bot.stats['coin']}", inline=True)
    embed.add_field(name="ID", value=f"`{bot.stats['current_id']}`", inline=False)
    if bot.status_msg:
        try: await bot.status_msg.edit(embed=embed)
        except: bot.status_msg = await channel.send(embed=embed)
    else: bot.status_msg = await channel.send(embed=embed)

async def farm_worker(ctx, targets, channel, fb):
    jobs = [{"t":"facebook_like","p":r'/a/like.php\?[^"]+'}, {"t":"facebook_follow","p":r'/a/subscribe.php\?[^"]+'}]
    bot.stats["status"] = "🟢 Đang cày"
    while bot.is_running:
        for acc in targets:
            if not bot.is_running: break
            bot.stats["current_id"] = acc
            tds_api("?fields=run", {"id": acc})
            for j in jobs:
                if not bot.is_running: break
                data = tds_api(f"?fields={j['t']}")
                if "data" not in data or not data["data"]: continue
                for item in data["data"]:
                    if not bot.is_running: break
                    try:
                        resp = fb.s.get(f"https://mbasic.facebook.com/{item['id']}", timeout=10)
                        links = re.findall(j['p'], resp.text)
                        if links:
                            fb.s.get("https://mbasic.facebook.com" + links[0].replace("&amp;", "&"), timeout=10)
                            res_c = tds_api("coin/", {"type": j['t'].upper(), "id": item['id']})
                            if "success" in str(res_c):
                                bot.stats["job"] += 1
                                bot.stats["coin"] = res_c.get('data', {}).get('sodu', bot.stats["coin"])
                                await update_status_embed(channel)
                        await asyncio.sleep(25)
                    except: continue

@bot.command()
async def run(ctx, *, info: str):
    chan = discord.utils.get(ctx.guild.channels, name="status")
    if not chan: return await ctx.send("❌ Tạo kênh #status trước!")
    try:
        u, p, k = [x.strip() for x in info.split('|')]
        fb = FB_Auto(PROXY_DEFAULT)
        ck = fb.login(u, p, k)
        if ck:
            r_pg = fb.s.get("https://mbasic.facebook.com/pages/launchpad/more_pages/").text
            pgs = list(set(re.findall(r'delegate_page_id=(\d+)', r_pg)))
            bot.is_running = True
            asyncio.create_task(farm_worker(ctx, [u] + pgs, chan, fb))
            await ctx.send(f"✅ Đã chạy: `{u}`")
        else: await ctx.send("❌ Login thất bại!")
    except: await ctx.send("⚠️ Định dạng: `uid|pass|2fa`")

app = Flask(__name__)
@app.route('/')
def home(): return "Bot IS Running"

if __name__ == "__main__":
    Thread(target=lambda: app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))).start()
    bot.run(TOKEN_DISCORD)
