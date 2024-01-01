import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://pb.lumopi.se/");

interface Grocery {
	collectionId: string;
	collectionName: string;
	created: string;
	id: string;
	image: string;
	name: string;
	picked: boolean;
	updated: string;
}
async function fetchGroceries(): Promise<Grocery[]> {
	const records = await pb.collection("groceries").getFullList({
		sort: "picked,-created",
	});
	console.log(records);
	return records as Grocery[];
}
async function createGrocery(name: string) {
	// example create data
	const data = {
		name: name,
		picked: false,
	};

	await pb.collection("groceries").create(data);
}
async function updateGrocery(
	recordId: string,
	data: { name: string; picked: boolean }
) {
	await pb.collection("groceries").update(recordId, data);
}
async function deletePickedGroceries(groceries: Grocery[]) {
	const pickedGroceries = groceries
		.filter((grocery) => grocery.picked)
		.map((grocery) => grocery.id);

	for (const id of pickedGroceries) {
		await pb.collection("groceries").delete(id);
	}
}

function App() {
	const [groceries, setGroceries] = useState<Grocery[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [animationParent] = useAutoAnimate();

	useEffect(() => {
		const fetchAndSetGroceries = async () => {
			const records = await fetchGroceries();
			setGroceries(records);
		};

		fetchAndSetGroceries();

		let unsubscribe: (() => void) | null = null;
		pb.collection("groceries")
			.subscribe("*", function (e) {
				console.log(e.action);
				console.log(e.record);
				fetchAndSetGroceries();
			})
			.then((func) => {
				unsubscribe = func;
			});

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, []);
	return (
		<main className="min-h-screen bg-white dark:bg-gray-900">
			<header className="bg-white dark:bg-gray-800 shadow w-full z-10">
				<div className="container mx-auto py-3 px-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Inköpslista NY
					</h1>
					<Button
						className="md:inline-flex bg-red-600"
						onClick={() => deletePickedGroceries(groceries)}
					>
						Rensa markerade
					</Button>
				</div>
			</header>
			<section className="pt-8 px-3 md:px-6 bg-white dark:bg-gray-900 pb-28">
				<div className="container mx-auto">
					<ul ref={animationParent}>
						{groceries.map((grocery) => (
							<li
								key={grocery.id}
								className="flex items-center justify-between p-4 mb-2 border rounded-lg"
							>
								<div className="flex items-center gap-4">
									<img
										alt="Item image"
										height="50"
										src={"/" + grocery.image}
										style={{
											aspectRatio: "50/50",
											objectFit: "cover",
										}}
										width="50"
									/>
									<p className="font-medium">{grocery.name}</p>
								</div>
								<Checkbox
									checked={grocery.picked}
									onClick={async () => {
										await updateGrocery(grocery.id, {
											name: grocery.name,
											picked: !grocery.picked,
										});
									}}
									id={grocery.id}
								/>
							</li>
						))}
					</ul>
				</div>
			</section>
			<footer className="w-full fixed bottom-0 bg-white dark:bg-gray-800 shadow py-2 px-8">
				<form
					onSubmit={async (e) => {
						e.preventDefault();
						await createGrocery(inputValue);
						setInputValue("");
					}}
				>
					<Input
						className="mb-4 w-full"
						placeholder="New item"
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
					/>
					<Button className="w-full py-2 bg-green-600" type="submit">
						Lägg till
					</Button>
				</form>
			</footer>
		</main>
	);
}

export default App;
