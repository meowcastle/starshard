import manzil_v6 as v, json
TWELVE=[6,10,17,18,5,4,3,19,7,26,12,14]; FIVE=[6,10,17,18,5]; SKY=[101,102,103,104,105]
def cell(pack, you_depth, depth=8, guarantee=True):
    C=v.Cards(own_all=True); w=t=0
    for tonight in range(1,29):
        for seed in range(1,9):
            hand=v.deal(pack,seed,tonight,guarantee)
            for leader in ("you","sky"):
                r=v.play_board(C,hand,SKY,tonight,leader=leader,you_depth=you_depth,depth=depth)
                t+=1
                if r["win"]: w+=1
    return round(100*w/t,1)
out={}
out["pack5"]=[cell(FIVE,8),cell(FIVE,0)]
out["pack12"]=[cell(TWELVE,8),cell(TWELVE,0)]
out["pack12_noguar"]=[cell(TWELVE,8,8,False),cell(TWELVE,0,8,False)]
out["depth"]=[cell(TWELVE,8,8),cell(TWELVE,8,12),cell(TWELVE,8,14),cell(TWELVE,8,24)]
print(json.dumps(out))
