import struct, zlib

def make_png(size, color=(59, 130, 246)):
    """Generate a minimal solid-color PNG"""
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    
    raw = b''
    for _ in range(size):
        row = b'\x00' + bytes(color) * size
        raw += row
    
    compressed = zlib.compress(raw)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

for s in [16, 48, 128]:
    with open(f'public/icons/icon{s}.png', 'wb') as f:
        f.write(make_png(s))
    print(f'Created icon{s}.png')

print('Done')
