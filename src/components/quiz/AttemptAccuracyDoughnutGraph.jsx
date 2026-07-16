import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
	plugins: {
		title: { display: false },
		legend: { display: false }
	}
};

export default function AttemptAccuracyDoughnutGraph({ data_points }) {
	const data = {
		labels: ['Correct Answers', 'Wrong Answers'],
		datasets: [
			{
				label: 'Attempt Accuracy',
				data: data_points,
				backgroundColor: ['var(--success)', 'var(--danger)'],
				cutout: '70%',
				borderWidth: 0
			}
		]
	};
	return <Doughnut data={data} options={options} />;
}
