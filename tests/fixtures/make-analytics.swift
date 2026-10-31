import AppKit
let size=NSSize(width:900,height:1400)
let image=NSImage(size:size)
image.lockFocus()
NSColor.white.setFill();NSRect(origin:.zero,size:size).fill()
func line(_ text:String,_ x:CGFloat,_ y:CGFloat,_ size:CGFloat=34){(text as NSString).draw(at:NSPoint(x:x,y:y),withAttributes:[.font:NSFont.systemFont(ofSize:size),.foregroundColor:NSColor.black])}
line("Instagram",60,1300,30);line("Reel insights",60,1220,46);line("TEST FIXTURE - NOT REAL ACCOUNT DATA",60,1160,22)
let labels=[("Views","12,430"),("Accounts reached","8,020"),("Likes","320"),("Comments","0"),("Shares","45"),("Saves","61"),("New followers","18")]
for (i,pair) in labels.enumerated(){let y=CGFloat(1050-i*120);line(pair.0,60,y);line(pair.1,690,y)}
image.unlockFocus()
let bitmap=NSBitmapImageRep(data:image.tiffRepresentation!)!
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:CommandLine.arguments[1]))
