const fs = require('fs');
let c = fs.readFileSync('src/components/srivalli/PublicPages.tsx', 'utf8');

const target = `            <div className="space-y-2">
              <Label htmlFor="rs-time">Preferred Class Time</Label>
              <Input id="rs-time" placeholder="e.g. 4 PM - 6 PM" value={form.preferredClassTime} onChange={e => update('preferredClassTime', e.target.value)} />
            </div>
          </div>
}`;

const replacement = `            <div className="space-y-2">
              <Label htmlFor="rs-time">Preferred Class Time</Label>
              <Input id="rs-time" placeholder="e.g. 4 PM - 6 PM" value={form.preferredClassTime} onChange={e => update('preferredClassTime', e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-purple-700 text-white font-semibold text-base py-6" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Student'}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
  );
}`;

c = c.replace(target, replacement);
fs.writeFileSync('src/components/srivalli/PublicPages.tsx', c, 'utf8');
console.log('Fixed syntax error');
