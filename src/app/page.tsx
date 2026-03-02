import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">まなびチェック</h1>
          <p className="text-muted-foreground">個別最適化学習システム</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>保護者の方</CardTitle>
            <CardDescription>
              アクセスコードでログインして、小テストの採点・弱点分析を行えます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/parent/login">
              <Button className="w-full" size="lg">
                ログインする
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>講師の方</CardTitle>
            <CardDescription>
              問題の登録・テストの管理・生徒管理を行えます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/units">
              <Button variant="outline" className="w-full" size="lg">
                管理画面へ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
