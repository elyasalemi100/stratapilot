import {
  getEmailWhitelist,
  addEmailWhitelist,
  removeEmailWhitelist,
} from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { WhitelistForm } from "./whitelist-form";
import { WhitelistRow } from "./whitelist-row";

export default async function AdminWhitelistPage() {
  const patterns = await getEmailWhitelist();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Whitelist</h1>
        <p className="text-muted-foreground">
          When whitelist is enabled in settings, only these patterns can sign up
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Add Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WhitelistForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <p className="text-muted-foreground">No patterns. Add domain (e.g. @company.com) or exact email.</p>
          ) : (
            <div className="space-y-2">
              {patterns.map((p) => (
                <WhitelistRow key={p.id} id={p.id} pattern={p.pattern} patternType={p.pattern_type} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
